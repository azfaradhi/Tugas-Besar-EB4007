import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data dokter
export async function GET() {
  try {
    const [doctors] = await db.query(`
      SELECT
        k.ID_karyawan,
        k.Nama,
        k.NIK,
        k.Tanggal_lahir,
        k.Umur,
        k.Jenis_kelamin,
        k.No_telpon,
        k.Alamat,
        d.Spesialis,
        d.STR,
        d.Status,
        d.Shift
      FROM Dokter d
      JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      ORDER BY k.Nama ASC
    `);

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
