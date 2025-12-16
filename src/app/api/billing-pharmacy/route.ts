import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { query } from '@/lib/db';

interface BillingFarmasiRow {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: number;
  nama_pasien: string;
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
        p.Nama AS nama_pasien
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ID_hasil, ID_pasien, Total_harga } = body;

    if (!ID_hasil || !ID_pasien || !Total_harga) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Billing_Farmasi'
    );
    const count = countResult[0].count;
    const ID_billing_farmasi = `BF${String(count + 1).padStart(6, '0')}`;

    await query(
      `INSERT INTO Billing_Farmasi
       (ID_billing_farmasi, ID_hasil, ID_pasien, Total_harga, isLunas)
       VALUES (?, ?, ?, ?, FALSE)`,
      [ID_billing_farmasi, ID_hasil, ID_pasien, Total_harga]
    );

    return NextResponse.json({
      success: true,
      ID_billing_farmasi,
      message: 'Billing farmasi created successfully'
    });
  } catch (error) {
    console.error('Error creating billing farmasi:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ID_billing_farmasi, ...updates } = body;

    if (!ID_billing_farmasi) {
      return NextResponse.json(
        { error: 'ID_billing_farmasi is required' },
        { status: 400 }
      );
    }

    const setParts = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);

    await query(
      `UPDATE Billing_Farmasi SET ${setParts.join(', ')} WHERE ID_billing_farmasi = ?`,
      [...values, ID_billing_farmasi]
    );

    return NextResponse.json({
      success: true,
      message: 'Billing farmasi updated successfully'
    });
  } catch (error) {
    console.error('Error updating billing farmasi:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


