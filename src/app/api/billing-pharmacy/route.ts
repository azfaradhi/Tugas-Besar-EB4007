import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';

interface BillingFarmasiRow {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: number;
  nama_pasien: string;
  NIK: string;
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
        bf.ID_billing_farmasi,
        bf.ID_hasil,
        bf.ID_pasien,
        bf.Total_harga,
        bf.Lunas_date,
        bf.Jenis_pembayaran,
        bf.isLunas,
        p.Nama AS nama_pasien,
        p.NIK
      FROM Billing_Farmasi bf
      JOIN Pasien p ON p.ID_pasien = bf.ID_pasien
      WHERE bf.ID_pasien = ?
      ORDER BY bf.Lunas_date DESC IS NULL, bf.Lunas_date DESC
      `,
      [patientId]
    );

    const typedRows = rows as BillingFarmasiRow[];

    return NextResponse.json({ billings: rows });
  } catch (error) {
    console.error('Error fetching billing farmasi:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


