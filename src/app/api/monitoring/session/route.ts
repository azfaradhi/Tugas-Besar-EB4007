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
    
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create monitoring sessions' },
        { status: 403 }
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

    // Create new session
    const sessionId = uuidv4();

    await db.query(
      `INSERT INTO monitoring_sessions 
       (session_id, patient_id, doctor_id, appointment_id, notes, status, started_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      [sessionId, patientId, user.profileId, appointmentId, notes]
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

    // Update session status
    await db.query(
      `UPDATE monitoring_sessions 
       SET status = 'completed', ended_at = NOW(), notes = COALESCE(?, notes)
       WHERE session_id = ?`,
      [notes, sessionId]
    );

    return NextResponse.json({
      message: 'Monitoring session ended successfully'
    });

  } catch (error) {
    console.error('End monitoring session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
