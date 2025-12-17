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
  status_proses: 'pending' | 'processed' | 'completed';
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
        bf.status_proses,
        bf.isLunas,
        p.Nama AS nama_pasien
      FROM Billing_Farmasi bf
      JOIN Pasien p ON p.ID_pasien = bf.ID_pasien
      WHERE bf.ID_pasien = ?
      ORDER BY bf.status_proses ASC, bf.Lunas_date DESC
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
    const { ID_billing_farmasi, isLunas, Jenis_pembayaran, status_proses, ...otherUpdates } = body;

    if (!ID_billing_farmasi) {
      return NextResponse.json(
        { error: 'ID_billing_farmasi is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Handle other updates
    for (const [key, value] of Object.entries(otherUpdates)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    // Handle Jenis_pembayaran
    if (Jenis_pembayaran !== undefined) {
      const validPaymentMethods = ['Cash', 'Debit', 'Credit'];
      if (validPaymentMethods.includes(Jenis_pembayaran)) {
        updates.push('Jenis_pembayaran = ?');
        values.push(Jenis_pembayaran);
      }
    }

    // Handle status_proses
    if (status_proses !== undefined) {
      const validStatuses = ['pending', 'processed', 'completed'];
      if (validStatuses.includes(status_proses)) {
        updates.push('status_proses = ?');
        values.push(status_proses);
      }
    }

    // Handle isLunas and Lunas_date
    if (isLunas !== undefined) {
      updates.push('isLunas = ?');
      values.push(isLunas ? 1 : 0);

      if (isLunas) {
        const now = new Date();
        const lunas_date = now.toISOString().slice(0, 19).replace('T', ' ');
        updates.push('Lunas_date = ?');
        values.push(lunas_date);

        // Auto-set status_proses to 'completed' when paid
        updates.push('status_proses = ?');
        values.push('completed');
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE Billing_Farmasi SET ${updates.join(', ')} WHERE ID_billing_farmasi = ?`,
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


