import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data pasien
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('id');

    let query = 'SELECT * FROM Pasien';

    const conditions: string[] = [];
    const params: any[] = [];

    if (patientId) {
      conditions.push('ID_pasien = ?');
      params.push(patientId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [patients] = await db.query(query, params);

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Menambahkan pasien baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      Nama,
      NIK,
      Tanggal_lahir,
      Jenis_kelamin,
      No_telpon,
      Alamat,
      Golongan_darah,
      Riwayat_penyakit
    } = body;

    if (!Nama || !NIK || !Tanggal_lahir || !Jenis_kelamin) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate ID_pasien
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Pasien'
    );
    const count = countResult[0].count;
    const ID_pasien = `P${String(count + 1).padStart(6, '0')}`;

    // Hitung umur dari tanggal lahir
    const birthDate = new Date(Tanggal_lahir);
    const today = new Date();
    const Umur = today.getFullYear() - birthDate.getFullYear();

    const [result] = await db.query(
      `INSERT INTO Pasien
      (ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit]
    );

    return NextResponse.json({
      message: 'Pasien berhasil ditambahkan',
      ID_pasien
    });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
