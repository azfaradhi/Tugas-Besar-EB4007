import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type Row = RowDataPacket & {
  ID_pertemuan: string;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  ID_ruangan: string | null;
  Lantai: number | null;
  GedungNama: string | null;
  DokterNama: string;
  PerawatNama: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'patientId query parameter is required' }, { status: 400 });
  }

  try {
    const [rows] = await db.query<Row[]>(
      `
      SELECT
        p.ID_pertemuan,
        p.Tanggal,
        p.Waktu_mulai,
        p.Waktu_selesai,
        p.status,
        p.ID_ruangan,
        r.Lantai,
        g.Nama AS GedungNama,
        k.Nama AS DokterNama,
        kp.Nama AS PerawatNama
      FROM Pertemuan p
      JOIN Dokter d        ON d.ID_karyawan   = p.ID_Dokter
      JOIN Karyawan k      ON k.ID_karyawan   = d.ID_karyawan
      LEFT JOIN Perawat pr ON pr.ID_karyawan  = p.ID_Perawat
      LEFT JOIN Karyawan kp ON kp.ID_karyawan = pr.ID_karyawan
      LEFT JOIN Ruangan r  ON r.ID_ruangan    = p.ID_ruangan
      LEFT JOIN Gedung g   ON g.ID_gedung     = r.ID_gedung
      WHERE p.ID_Pasien = ?
      AND treatment_plan = 'Rawat Inap'
      ORDER BY p.Tanggal DESC, p.Waktu_mulai DESC
      `,
      [patientId]
    );

    const schedules = rows.map(row => ({
      ID_pertemuan: row.ID_pertemuan,
      tanggal: row.Tanggal,
      waktu_mulai: row.Waktu_mulai,
      waktu_selesai: row.Waktu_selesai,
      status: row.status,
      ruangan: {
        id: row.ID_ruangan,
        lantai: row.Lantai,
        gedung_nama: row.GedungNama
      },
      dokter_nama: row.DokterNama,
      perawat_nama: row.PerawatNama
    }));

    return NextResponse.json({ schedules });
  } catch (e) {
    console.error('Error /api/inpatient:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
