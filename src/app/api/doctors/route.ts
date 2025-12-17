import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [doctors] = await db.execute(`
      SELECT
        k.ID_karyawan,
        k.Nama,
        k.Tanggal_lahir,
        k.Umur,
        k.Jenis_kelamin,
        k.No_telpon,
        k.Alamat,
        d.Spesialis,
        d.STR,
        d.Status,
        d.Shift,
        d.ID_Department,
        dep.Nama AS Department_Name
      FROM Dokter d
      JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      LEFT JOIN Departemen dep ON d.ID_Department = dep.ID_Department
      ORDER BY k.Nama ASC
    `);

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', details: errorMessage },
      { status: 500 }
    );
  }
}
