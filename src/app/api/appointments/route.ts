import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    let query = `
      SELECT
        a.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
    `;

    const params: any[] = [];

    if (patientId) {
      query += ' WHERE a.patient_id = ?';
      params.push(patientId);
    } else if (doctorId) {
      query += ' WHERE a.doctor_id = ?';
      params.push(doctorId);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [appointments] = await db.query(query, params);

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_id, doctor_id, appointment_date, appointment_time, complaint, registered_by } = body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM appointments WHERE DATE(created_at) = CURDATE()'
    );
    const todayCount = countResult[0].count;
    const sequence = String(todayCount + 1).padStart(3, '0');

    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');

    const appointment_number = `APT${year}${month}${day}${sequence}`;

    const [result] = await db.query(
      `INSERT INTO appointments
      (appointment_number, patient_id, doctor_id, appointment_date, appointment_time, complaint, registered_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [appointment_number, patient_id, doctor_id, appointment_date, appointment_time, complaint, registered_by]
    );

    return NextResponse.json({
      message: 'Pendaftaran berhasil',
      appointment_number,
      appointment_id: (result as any).insertId
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
