import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';

interface PharmacyRow {
  ID_hasil: string;
  diagnosis: string | null;
  status_hasil: 'draft' | 'completed';

  ID_pertemuan: string;
  Tanggal: string;       // DATE (string dari MySQL)
  Waktu_mulai: string;   // TIME (string dari MySQL)
  Waktu_selesai: string | null;
  status_pertemuan: 'scheduled' | 'completed' | 'cancelled';

  dokter_nama: string;

  ID_Obat: string;
  obat_nama: string;
  kategori: string;

  Dosis: string | null;
  Frekuensi: string | null;
  Durasi_hari: number | null;
  Aturan_pakai: string | null;

  Qty: number | null;
  Harga_satuan: number | null;
  Subtotal: number | null;

  ID_billing_farmasi: string | null;
  Total_harga: number | null;
  bf_isLunas: number | null;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT 
        hp.ID_hasil,
        hp.diagnosis,
        hp.status AS status_hasil,

        p.ID_pertemuan,
        p.Tanggal,
        p.Waktu_mulai,
        p.Waktu_selesai,
        p.status AS status_pertemuan,

        k.Nama AS dokter_nama,

        ho.ID_Obat,
        o.Nama AS obat_nama,
        o.Kategori AS kategori,

        ho.Dosis,
        ho.Frekuensi,
        ho.Durasi_hari,
        ho.Aturan_pakai,
        ho.Qty,
        ho.Harga_satuan,
        ho.Subtotal,

        bf.ID_billing_farmasi,
        bf.Total_harga,
        bf.isLunas AS bf_isLunas,
        bf.Lunas_date,
        bf.Jenis_pembayaran
      FROM Pertemuan p
      JOIN Hasil_Pemeriksaan hp ON hp.ID_pertemuan = p.ID_pertemuan
      JOIN Hasil_Obat ho        ON ho.ID_hasil     = hp.ID_hasil
      JOIN Obat o               ON o.ID_obat       = ho.ID_Obat
      JOIN Dokter d             ON d.ID_karyawan   = p.ID_Dokter
      JOIN Karyawan k           ON k.ID_karyawan   = d.ID_karyawan
      LEFT JOIN Billing_Farmasi bf ON bf.ID_hasil  = hp.ID_hasil
      WHERE p.ID_Pasien = ?
      ORDER BY p.Tanggal DESC, p.Waktu_mulai DESC, hp.ID_hasil, ho.ID_Obat
      `,
      [patientId]
    );

    const typedRows = rows as PharmacyRow[];

    // Group per ID_hasil (1 hasil pemeriksaan = 1 resep)
    const map: Record<string, any> = {};

    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );

    for (const row of rows) {
      if (!map[row.ID_hasil]) {
        const isRecent =
          new Date(row.Tanggal) >= sevenDaysAgo;

        map[row.ID_hasil] = {
          ID_hasil: row.ID_hasil,
          pertemuanId: row.ID_pertemuan,
          tanggal: row.Tanggal,
          waktu_mulai: row.Waktu_mulai,
          waktu_selesai: row.Waktu_selesai,
          dokter: row.dokter_nama,
          diagnosis: row.diagnosis,
          status: isRecent ? 'active' : 'history',
          billing: row.ID_billing_farmasi
            ? {
                ID_billing_farmasi: row.ID_billing_farmasi,
                Total_harga: row.Total_harga,
                isLunas: row.bf_isLunas,
                Lunas_date: row.Lunas_date,
                Jenis_pembayaran: row.Jenis_pembayaran,
              }
            : null,
          medications: [] as any[],
        };
      }

      map[row.ID_hasil].medications.push({
        ID_obat: row.ID_Obat,
        nama_obat: row.obat_nama,
        kategori: row.kategori,
        dosis: row.Dosis,
        frekuensi: row.Frekuensi,
        durasi_hari: row.Durasi_hari,
        catatan: row.Aturan_pakai,
        qty: row.Qty,
        harga_satuan: row.Harga_satuan,
        subtotal: row.Subtotal,
      });
    }

    const prescriptions = Object.values(map);

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching pharmacy data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
