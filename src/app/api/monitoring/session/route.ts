import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session
      const [sessions] = await db.query<any[]>(
        `SELECT 
          ms.*,
          p.Nama as patient_name,
          k.Nama as doctor_name
         FROM monitoring_sessions ms
         LEFT JOIN Pasien p ON ms.patient_id = p.ID_pasien
         LEFT JOIN Karyawan k ON ms.doctor_id = k.ID_karyawan
         WHERE ms.session_id = ?`,
        [sessionId]
      );

      if (sessions.length === 0) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ session: sessions[0] });
    }

    // Get active session for user
    let query = '';
    let params: any[] = [];

    if (user.role === 'patient') {
      query = `SELECT 
        ms.*,
        k.Nama as doctor_name
       FROM monitoring_sessions ms
       LEFT JOIN Karyawan k ON ms.doctor_id = k.ID_karyawan
       WHERE ms.patient_id = ? AND ms.status = 'active'
       ORDER BY ms.started_at DESC
       LIMIT 1`;
      params = [user.profileId];
    } else if (user.role === 'doctor') {
      query = `SELECT 
        ms.*,
        p.Nama as patient_name
       FROM monitoring_sessions ms
       LEFT JOIN Pasien p ON ms.patient_id = p.ID_pasien
       WHERE ms.doctor_id = ? AND ms.status = 'active'
       ORDER BY ms.started_at DESC`;
      params = [user.profileId];
    } else {
      return NextResponse.json(
        { error: 'Invalid role for monitoring' },
        { status: 403 }
      );
    }

    const [sessions] = await db.query<any[]>(query, params);

    if (sessions.length === 0) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session: sessions[0] });

  } catch (error) {
    console.error('Get monitoring session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patientId, appointmentId, notes } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const [patients] = await db.query<any[]>(
      'SELECT ID_pasien FROM Pasien WHERE ID_pasien = ?',
      [patientId]
    );

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active session for this patient
    const [existingSessions] = await db.query<any[]>(
      'SELECT session_id FROM monitoring_sessions WHERE patient_id = ? AND status = "active"',
      [patientId]
    );

    if (existingSessions.length > 0) {
      return NextResponse.json(
        { error: 'Patient already has an active monitoring session' },
        { status: 409 }
      );
    }

    // Determine doctor ID based on who's creating the session
    let doctorId = user.role === 'doctor' ? user.profileId : null;

    // If no appointmentId provided, find existing scheduled appointment or create new
    let finalAppointmentId = appointmentId;
    if (!finalAppointmentId) {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // First, check if there's already a scheduled Pertemuan for today for this patient
      const [scheduledAppointments] = await db.query<any[]>(
        `SELECT ID_pertemuan, ID_Dokter, Waktu_mulai
         FROM Pertemuan
         WHERE ID_Pasien = ?
           AND Tanggal = ?
           AND status = 'scheduled'
         ${doctorId ? 'AND ID_Dokter = ?' : ''}
         ORDER BY Waktu_mulai ASC
         LIMIT 1`,
        doctorId ? [patientId, today, doctorId] : [patientId, today]
      );

      if (scheduledAppointments.length > 0) {
        // Use the existing scheduled appointment
        finalAppointmentId = scheduledAppointments[0].ID_pertemuan;
        doctorId = scheduledAppointments[0].ID_Dokter; // Use the doctor from the appointment
        console.log(`Using existing scheduled Pertemuan ${finalAppointmentId} for monitoring session`);
      } else {
        // No scheduled appointment found for today
        if (!doctorId) {
          // Patient trying to create session without scheduled appointment
          return NextResponse.json(
            { error: 'Tidak ada jadwal pertemuan untuk hari ini. Silakan buat janji temu terlebih dahulu.' },
            { status: 400 }
          );
        }

        // Doctor creating session, create a new Pertemuan
        const [countResult] = await db.query<any[]>(
          'SELECT COUNT(*) as count FROM Pertemuan'
        );
        const count = countResult[0].count || 0;
        finalAppointmentId = `APT${String(count + 1).padStart(4, '0')}`;

        // Get current time
        const waktuMulai = now.toTimeString().split(' ')[0]; // HH:MM:SS

        // Create Pertemuan
        await db.query(
          `INSERT INTO Pertemuan
           (ID_pertemuan, ID_Pasien, ID_Dokter, Tanggal, Waktu_mulai, status)
           VALUES (?, ?, ?, ?, ?, 'scheduled')`,
          [finalAppointmentId, patientId, doctorId, today, waktuMulai]
        );

        console.log(`Auto-created Pertemuan ${finalAppointmentId} for monitoring session`);
      }
    } else {
      // appointmentId provided, get the doctor from the appointment
      const [appointment] = await db.query<any[]>(
        'SELECT ID_Dokter FROM Pertemuan WHERE ID_pertemuan = ?',
        [finalAppointmentId]
      );
      if (appointment.length > 0) {
        doctorId = appointment[0].ID_Dokter;
      }
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor information not found' },
        { status: 400 }
      );
    }

    // Create new session
    const sessionId = uuidv4();

    await db.query(
      `INSERT INTO monitoring_sessions
       (session_id, patient_id, doctor_id, appointment_id, notes, status, started_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      [sessionId, patientId, doctorId, finalAppointmentId, notes]
    );

    const [newSession] = await db.query<any[]>(
      `SELECT 
        ms.*,
        p.Nama as patient_name
       FROM monitoring_sessions ms
       LEFT JOIN Pasien p ON ms.patient_id = p.ID_pasien
       WHERE ms.session_id = ?`,
      [sessionId]
    );

    return NextResponse.json({
      message: 'Monitoring session created successfully',
      session: newSession[0]
    });

  } catch (error) {
    console.error('Create monitoring session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can end monitoring sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId, notes } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session belongs to this doctor
    const [sessions] = await db.query<any[]>(
      'SELECT * FROM monitoring_sessions WHERE session_id = ? AND doctor_id = ?',
      [sessionId, user.profileId]
    );

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    const session = sessions[0];

    // Calculate summary statistics from wearable_data
    const [hrData] = await db.query<any[]>(
      `SELECT
        AVG(value) as avg_val,
        MIN(value) as min_val,
        MAX(value) as max_val,
        COUNT(*) as count,
        SUM(CASE WHEN status IN ('warning', 'critical') THEN 1 ELSE 0 END) as anomaly_count
       FROM wearable_data
       WHERE session_id = ? AND measurement_type = 'heart_rate'`,
      [sessionId]
    );

    const [spo2Data] = await db.query<any[]>(
      `SELECT
        AVG(value) as avg_val,
        MIN(value) as min_val,
        MAX(value) as max_val,
        COUNT(*) as count
       FROM wearable_data
       WHERE session_id = ? AND measurement_type = 'spo2'`,
      [sessionId]
    );

    const hasAnomaly = (hrData[0]?.anomaly_count || 0) > 0;
    const avgHr = hrData[0]?.avg_val || null;
    const minHr = hrData[0]?.min_val || null;
    const maxHr = hrData[0]?.max_val || null;
    const avgSpo2 = spo2Data[0]?.avg_val || null;
    const minSpo2 = spo2Data[0]?.min_val || null;
    const maxSpo2 = spo2Data[0]?.max_val || null;

    // Update session with summary statistics
    await db.query(
      `UPDATE monitoring_sessions
       SET status = 'completed',
           ended_at = NOW(),
           avg_heart_rate = ?,
           min_heart_rate = ?,
           max_heart_rate = ?,
           avg_spo2 = ?,
           min_spo2 = ?,
           max_spo2 = ?,
           has_anomaly = ?,
           notes = COALESCE(?, notes)
       WHERE session_id = ?`,
      [avgHr, minHr, maxHr, avgSpo2, minSpo2, maxSpo2, hasAnomaly, notes, sessionId]
    );

    // If appointment_id exists, create or update Hasil_Pemeriksaan
    if (session.appointment_id) {
      const vitalNotes = `--- Vital Signs Monitoring ---\n` +
        `Heart Rate: ${avgHr} bpm (${minHr}-${maxHr} bpm)\n` +
        `SpO2: ${avgSpo2}% (${minSpo2}-${maxSpo2}%)\n` +
        `Anomaly Detected: ${hasAnomaly ? 'Yes' : 'No'}`;

      // Check if Hasil_Pemeriksaan exists for this pertemuan
      const [existingResults] = await db.query<any[]>(
        `SELECT ID_hasil, notes FROM Hasil_Pemeriksaan WHERE ID_pertemuan = ? LIMIT 1`,
        [session.appointment_id]
      );

      if (existingResults.length > 0) {
        // Update existing Hasil_Pemeriksaan
        const hasilId = existingResults[0].ID_hasil;
        const existingNotes = existingResults[0].notes || '';
        let updatedNotes = existingNotes;

        // If monitoring section doesn't exist, append it
        if (!existingNotes.includes('--- Vital Signs Monitoring ---')) {
          updatedNotes = existingNotes ? `${existingNotes}\n\n${vitalNotes}` : vitalNotes;
        } else {
          // Replace existing monitoring section
          updatedNotes = existingNotes.replace(
            /--- Vital Signs Monitoring ---[\s\S]*?(?=\n\n---|$)/,
            vitalNotes
          );
        }

        await db.query(
          `UPDATE Hasil_Pemeriksaan
           SET detak_jantung = ?,
               kadar_oksigen = ?,
               notes = ?,
               updated_at = NOW()
           WHERE ID_hasil = ?`,
          [avgHr, avgSpo2, updatedNotes, hasilId]
        );
      } else {
        // Create new Hasil_Pemeriksaan ONLY if it doesn't exist
        // Use sequential ID instead of timestamp-based to avoid collisions
        const [countResult] = await db.query<any[]>(
          'SELECT COUNT(*) as count FROM Hasil_Pemeriksaan'
        );
        const count = countResult[0].count || 0;
        const hasilId = `HSL${String(count + 1).padStart(3, '0')}`;

        // Double-check that this pertemuan still doesn't have a result
        // (in case of race condition)
        const [doubleCheck] = await db.query<any[]>(
          `SELECT ID_hasil FROM Hasil_Pemeriksaan WHERE ID_pertemuan = ? LIMIT 1`,
          [session.appointment_id]
        );

        if (doubleCheck.length === 0) {
          await db.query(
            `INSERT INTO Hasil_Pemeriksaan
             (ID_hasil, ID_pertemuan, detak_jantung, kadar_oksigen, notes, status)
             VALUES (?, ?, ?, ?, ?, 'draft')`,
            [hasilId, session.appointment_id, avgHr, avgSpo2, vitalNotes]
          );
        }
      }
    }

    return NextResponse.json({
      message: 'Monitoring session ended successfully',
      summary: {
        avgHr, minHr, maxHr, avgSpo2, minSpo2, maxSpo2, hasAnomaly
      }
    });

  } catch (error) {
    console.error('End monitoring session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
