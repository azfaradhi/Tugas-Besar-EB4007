import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const patientId = searchParams.get('patientId');

    if (!sessionId && !patientId) {
      return NextResponse.json(
        { error: 'Session ID or Patient ID is required' },
        { status: 400 }
      );
    }

    let query = '';
    let params: any[] = [];

    if (sessionId) {
      // Get results for specific session
      query = `SELECT 
        ms.session_id,
        ms.patient_id,
        ms.doctor_id,
        ms.started_at,
        ms.ended_at,
        ms.avg_heart_rate,
        ms.min_heart_rate,
        ms.max_heart_rate,
        ms.avg_spo2,
        ms.min_spo2,
        ms.max_spo2,
        ms.has_anomaly,
        ms.notes,
        p.Nama as patient_name,
        k.Nama as doctor_name
       FROM monitoring_sessions ms
       LEFT JOIN Pasien p ON ms.patient_id = p.ID_pasien
       LEFT JOIN Karyawan k ON ms.doctor_id = k.ID_karyawan
       WHERE ms.session_id = ? AND ms.status = 'completed'`;
      params = [sessionId];
    } else {
      // Get all completed sessions for patient
      query = `SELECT 
        ms.session_id,
        ms.started_at,
        ms.ended_at,
        ms.avg_heart_rate,
        ms.min_heart_rate,
        ms.max_heart_rate,
        ms.avg_spo2,
        ms.min_spo2,
        ms.max_spo2,
        ms.has_anomaly,
        ms.notes,
        k.Nama as doctor_name
       FROM monitoring_sessions ms
       LEFT JOIN Karyawan k ON ms.doctor_id = k.ID_karyawan
       WHERE ms.patient_id = ? AND ms.status = 'completed'
       ORDER BY ms.ended_at DESC`;
      params = [patientId];
    }

    const [results] = await db.query<any[]>(query, params);

    if (sessionId && results.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or not completed yet' },
        { status: 404 }
      );
    }

    // Format results
    const formattedResults = results.map(r => ({
      sessionId: r.session_id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      summary: {
        heartRate: {
          average: parseFloat(r.avg_heart_rate || 0),
          minimum: parseFloat(r.min_heart_rate || 0),
          maximum: parseFloat(r.max_heart_rate || 0)
        },
        spo2: {
          average: parseFloat(r.avg_spo2 || 0),
          minimum: parseFloat(r.min_spo2 || 0),
          maximum: parseFloat(r.max_spo2 || 0)
        },
        hasAnomaly: r.has_anomaly === 1 || r.has_anomaly === true
      },
      notes: r.notes
    }));

    if (sessionId) {
      return NextResponse.json({ result: formattedResults[0] });
    }

    return NextResponse.json({ results: formattedResults });

  } catch (error) {
    console.error('Get monitoring results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
