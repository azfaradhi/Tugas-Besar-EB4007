import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const appointmentId = searchParams.get('id');

    let query = `
      SELECT
        a.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if(appointmentId) {
      conditions.push('a.id = ?');
      params.push(appointmentId);
    }

    if (patientId) {
      conditions.push('a.patient_id = ?');
      params.push(patientId);
    }

    if (doctorId) {
      conditions.push('a.doctor_id = ?');
      params.push(doctorId);
    }

    if (date) {
      conditions.push('a.appointment_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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

    // Generate appointment number
    const appointment_number = `APT-${new Date().getFullYear()}-${Date.now()}`;

    const [result] = await db.query(
      `INSERT INTO appointments
      (appointment_number, patient_id, doctor_id, appointment_date, appointment_time, complaint, registered_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [appointment_number, patient_id, doctor_id, appointment_date, appointment_time, complaint, registered_by]
    );

    return NextResponse.json({
      message: 'Pendaftaran berhasil',
      appointment_number
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID dan status wajib dikirim." },
        { status: 400 }
      );
    }

    const allowedStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (!allowedStatus.includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      `UPDATE appointments
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, id]
    );

    // Jika id tidak ditemukan
    // @ts-ignore
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Appointment tidak ditemukan." },
        { status: 404 }
      );
    }

    const [rows]: any[] = await db.query(
      `SELECT
        a.*,
        p.name AS patient_name,
        d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [id]
    );

    return NextResponse.json({
      message: "Status berhasil diperbarui.",
      appointment: rows[0],
    });

  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

