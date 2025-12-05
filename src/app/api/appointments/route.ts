import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data pertemuan (appointments)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const pertemuanId = searchParams.get('id');

    let query = `
      SELECT
        p.*,
        pas.Nama as patient_name,
        d.Spesialis as doctor_specialization,
        k.Nama as doctor_name
      FROM Pertemuan p
      JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      JOIN Dokter d ON p.ID_Dokter = d.ID_karyawan
      JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (pertemuanId) {
      conditions.push('p.ID_pertemuan = ?');
      params.push(pertemuanId);
    }

    if (patientId) {
      conditions.push('p.ID_Pasien = ?');
      params.push(patientId);
    }

    if (doctorId) {
      conditions.push('p.ID_Dokter = ?');
      params.push(doctorId);
    }

    if (date) {
      conditions.push('p.Tanggal = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.Tanggal DESC, p.Waktu_mulai DESC';

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

// POST - Membuat pertemuan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    const { patient_id: ID_Pasien, doctor_id: ID_Dokter, ID_Perawat, ID_ruangan, appointment_date: Tanggal, appointment_time: Waktu_mulai, Waktu_selesai } = body;

    if (!ID_Pasien || !ID_Dokter || !Tanggal || !Waktu_mulai) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate ID_pertemuan
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Pertemuan WHERE DATE(Tanggal) = CURDATE()'
    );
    const todayCount = countResult[0].count;
    const sequence = String(todayCount + 1).padStart(4, '0');

    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');

    const ID_pertemuan = `PT${year}${month}${day}${sequence}`;

    await db.query(
      `INSERT INTO Pertemuan
      (ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai]
    );

    return NextResponse.json({
      message: 'Pertemuan berhasil dibuat',
      ID_pertemuan
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT - Update pertemuan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID_pertemuan, Waktu_selesai, ID_Perawat, ID_ruangan } = body;

    if (!ID_pertemuan) {
      return NextResponse.json(
        { error: "ID pertemuan wajib dikirim." },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (Waktu_selesai !== undefined) {
      updateFields.push('Waktu_selesai = ?');
      params.push(Waktu_selesai);
    }

    if (ID_Perawat !== undefined) {
      updateFields.push('ID_Perawat = ?');
      params.push(ID_Perawat);
    }

    if (ID_ruangan !== undefined) {
      updateFields.push('ID_ruangan = ?');
      params.push(ID_ruangan);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang diupdate." },
        { status: 400 }
      );
    }

    params.push(ID_pertemuan);

    const [result] = await db.query(
      `UPDATE Pertemuan SET ${updateFields.join(', ')} WHERE ID_pertemuan = ?`,
      params
    );

    // @ts-ignore
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Pertemuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const [rows]: any[] = await db.query(
      `SELECT
        p.*,
        pas.Nama as patient_name,
        k.Nama as doctor_name
       FROM Pertemuan p
       JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
       JOIN Karyawan k ON p.ID_Dokter = k.ID_karyawan
       WHERE p.ID_pertemuan = ?`,
      [ID_pertemuan]
    );

    return NextResponse.json({
      message: "Pertemuan berhasil diperbarui.",
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
