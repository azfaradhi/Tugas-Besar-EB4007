import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID diperlukan' },
        { status: 400 }
      );
    }

    const [data] = await db.query(
      `SELECT * FROM wearable_data
       WHERE patient_id = ?
       ORDER BY measured_at DESC
       LIMIT 50`,
      [patientId]
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get wearable data error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_id, device_id, measurement_type, value, unit, measured_at, status, notes } = body;

    if (!patient_id || !measurement_type || !value) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO wearable_data
      (patient_id, device_id, measurement_type, value, unit, measured_at, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, device_id, measurement_type, value, unit, measured_at || new Date(), status || 'normal', notes]
    );

    return NextResponse.json({
      message: 'Data berhasil disimpan'
    });
  } catch (error) {
    console.error('Create wearable data error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
