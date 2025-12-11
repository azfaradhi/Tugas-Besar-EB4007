import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let sql = `
      SELECT
        hp.ID_hasil,
        hp.ID_pertemuan,
        hp.diagnosis,
        hp.status as hasil_status,
        p.ID_Pasien,
        p.Tanggal,
        p.Waktu_mulai,
        pas.Nama as nama_pasien,
        pas.NIK,
        k.Nama as nama_dokter,
        d.Spesialis,
        CASE
          WHEN ut.ID_uji IS NOT NULL THEN 'urin'
          WHEN r.ID_ronsen IS NOT NULL THEN 'ronsen'
          ELSE NULL
        END as test_type,
        ut.ID_uji,
        r.ID_ronsen
      FROM Hasil_Pemeriksaan hp
      JOIN Pertemuan p ON hp.ID_pertemuan = p.ID_pertemuan
      JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      LEFT JOIN Dokter d ON p.ID_Dokter = d.ID_karyawan
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      LEFT JOIN UrinTest ut ON hp.ID_hasil = ut.ID_hasil
      LEFT JOIN Ronsen r ON hp.ID_hasil = r.ID_hasil
      WHERE (ut.ID_uji IS NOT NULL OR r.ID_ronsen IS NOT NULL)
    `;

    const params: any[] = [];

    if (type === 'urin') {
      sql += ' AND ut.ID_uji IS NOT NULL';
    } else if (type === 'ronsen') {
      sql += ' AND r.ID_ronsen IS NOT NULL';
    }

    sql += ' ORDER BY p.Tanggal DESC, p.Waktu_mulai DESC';

    const labTests = await query(sql, params);

    for (const test of labTests as any[]) {
      if (test.test_type === 'urin') {
        const urinData: any = await query(
          'SELECT * FROM UrinTest WHERE ID_uji = ?',
          [test.ID_uji]
        );
        test.urin_data = urinData.length > 0 ? urinData[0] : null;
      } else if (test.test_type === 'ronsen') {
        const ronsenData: any = await query(
          'SELECT * FROM Ronsen WHERE ID_ronsen = ?',
          [test.ID_ronsen]
        );
        test.ronsen_data = ronsenData.length > 0 ? ronsenData[0] : null;
      }
    }

    return NextResponse.json({
      success: true,
      labTests
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
