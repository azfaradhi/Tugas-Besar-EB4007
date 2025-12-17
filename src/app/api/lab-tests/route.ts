import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'urin' | 'ronsen' | null

    let sql = `
      SELECT
        hp.ID_hasil,
        hp.ID_pertemuan,
        hp.diagnosis,
        hp.treatment_plan,
        hp.status as hasil_status,
        hp.created_at,

        p.Tanggal,
        p.Waktu_mulai,

        pas.ID_pasien,
        pas.Nama as nama_pasien,

        k.Nama as nama_dokter,
        d.Spesialis,

        ut.ID_uji,
        r.ID_ronsen
      FROM Hasil_Pemeriksaan hp
      JOIN Pertemuan p ON hp.ID_pertemuan = p.ID_pertemuan
      JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      LEFT JOIN Dokter d ON p.ID_Dokter = d.ID_karyawan
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      LEFT JOIN UrinTest ut ON hp.ID_hasil = ut.ID_hasil
      LEFT JOIN Ronsen r ON hp.ID_hasil = r.ID_hasil
      WHERE hp.treatment_plan IN ('urin','ronsen')
    `;

    const params: any[] = [];

    if (type === 'urin') {
      sql += ` AND hp.treatment_plan = 'urin'`;
    } else if (type === 'ronsen') {
      sql += ` AND hp.treatment_plan = 'ronsen'`;
    }

    sql += ` ORDER BY hp.created_at DESC`;

    const labTests = await query(sql, params) as any[];

    // attach detail hasil lab (kalau sudah dikerjakan)
    for (const test of labTests) {
      if (test.treatment_plan === 'urin' && test.ID_uji) {
        const urin = await query(
          'SELECT * FROM UrinTest WHERE ID_uji = ?',
          [test.ID_uji]
        ) as any[];
        test.urin_data = urin[0] ?? null;
      }

      if (test.treatment_plan === 'ronsen' && test.ID_ronsen) {
        const ronsen = await query(
          'SELECT * FROM Ronsen WHERE ID_ronsen = ?',
          [test.ID_ronsen]
        ) as any[];
        test.ronsen_data = ronsen[0] ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      labTests,
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}