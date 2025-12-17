import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get jadwal praktik dokter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      );
    }

    // Ambil jadwal dari tabel Pertemuan
    const jadwals: any = await query(
      `SELECT
        p.ID_pertemuan as ID_jadwal,
        p.ID_Dokter,
        p.ID_ruangan,
        DATE_FORMAT(CONCAT(p.Tanggal, ' ', p.Waktu_mulai), '%Y-%m-%d %H:%i:%s') as Date,
        p.Tanggal,
        p.Waktu_mulai,
        p.Waktu_selesai,
        p.status,
        r.Lantai as ruangan_lantai,
        g.Nama as gedung_nama,
        g.ID_gedung,
        pas.Nama as patient_name,
        pas.ID_pasien
      FROM Pertemuan p
      LEFT JOIN Ruangan r ON p.ID_ruangan = r.ID_ruangan
      LEFT JOIN Gedung g ON r.ID_gedung = g.ID_gedung
      LEFT JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      WHERE p.ID_Dokter = ?
      ORDER BY p.Tanggal ASC, p.Waktu_mulai ASC`,
      [doctorId]
    );

    console.log('Jadwal praktik for doctor', doctorId, ':', jadwals);

    return NextResponse.json({
      jadwals: jadwals || []
    });
  } catch (error: any) {
    console.error('Error fetching jadwal praktik:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jadwal praktik' },
      { status: 500 }
    );
  }
}

// Note: Jadwal praktik sekarang menggunakan tabel Pertemuan
// Untuk membuat jadwal baru, gunakan endpoint /api/pertemuan
