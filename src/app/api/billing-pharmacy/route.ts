import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { query } from '@/lib/db';

type StatusProses = 'pending' | 'processed' | 'completed';
type PaymentMethod = 'Cash' | 'Debit' | 'Credit';

interface BillingFarmasiRow extends RowDataPacket {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number;
  Lunas_date: string | null;
  Jenis_pembayaran: PaymentMethod | null;
  status_proses: StatusProses;
  isLunas: number; // biasanya 0/1 dari MariaDB
  nama_pasien: string;
}

const VALID_PAYMENT: PaymentMethod[] = ['Cash', 'Debit', 'Credit'];
const VALID_STATUS: StatusProses[] = ['pending', 'processed', 'completed'];

function nowSQL(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function generateBillingFarmasiId(): Promise<string> {
  // Lebih aman dari COUNT(*) (meski masih belum se-perfect auto increment)
  const rows: any = await query(
    `SELECT ID_billing_farmasi
     FROM Billing_Farmasi
     ORDER BY ID_billing_farmasi DESC
     LIMIT 1`
  );

  const lastId: string | undefined = rows?.[0]?.ID_billing_farmasi;
  const lastNum = lastId ? Number(String(lastId).replace(/^BF/, '')) : 0;
  const nextNum = Number.isFinite(lastNum) ? lastNum + 1 : 1;

  return `BF${String(nextNum).padStart(6, '0')}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const hasilId = searchParams.get('hasilId');

  if (!patientId && !hasilId) {
    return NextResponse.json(
      { error: 'patientId atau hasilId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    let sql = `
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
      WHERE 1=1
    `;
    const params: any[] = [];

    if (patientId) {
      sql += ` AND bf.ID_pasien = ?`;
      params.push(patientId);
    }
    if (hasilId) {
      sql += ` AND bf.ID_hasil = ?`;
      params.push(hasilId);
    }

    sql += ` ORDER BY bf.status_proses ASC, bf.Lunas_date DESC`;

    const [rows] = await db.query<BillingFarmasiRow[]>(sql, params);
    return NextResponse.json({ billings: rows });
  } catch (error) {
    console.error('Error fetching billing farmasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ID_hasil, ID_pasien, Total_harga } = body;

    if (!ID_hasil || !ID_pasien || Total_harga == null) {
      return NextResponse.json(
        { error: 'Missing required fields (ID_hasil, ID_pasien, Total_harga)' },
        { status: 400 }
      );
    }

    const total = Number(Total_harga);
    if (!Number.isFinite(total) || total < 0) {
      return NextResponse.json(
        { error: 'Total_harga must be a valid non-negative number' },
        { status: 400 }
      );
    }

    const ID_billing_farmasi = await generateBillingFarmasiId();

    await query(
      `INSERT INTO Billing_Farmasi
       (ID_billing_farmasi, ID_hasil, ID_pasien, Total_harga, isLunas)
       VALUES (?, ?, ?, ?, FALSE)`,
      [ID_billing_farmasi, ID_hasil, ID_pasien, total]
    );

    return NextResponse.json({
      success: true,
      ID_billing_farmasi,
      message: 'Billing farmasi created successfully',
    });
  } catch (error) {
    console.error('Error creating billing farmasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      ID_billing_farmasi,
      Total_harga,
      Jenis_pembayaran,
      status_proses,
      isLunas,
    } = body;

    if (!ID_billing_farmasi) {
      return NextResponse.json(
        { error: 'ID_billing_farmasi is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Allowlist: hanya field ini yang boleh di-update
    if (Total_harga !== undefined) {
      const total = Number(Total_harga);
      if (!Number.isFinite(total) || total < 0) {
        return NextResponse.json(
          { error: 'Total_harga must be a valid non-negative number' },
          { status: 400 }
        );
      }
      updates.push('Total_harga = ?');
      values.push(total);
    }

    if (Jenis_pembayaran !== undefined) {
      if (Jenis_pembayaran === null) {
        updates.push('Jenis_pembayaran = ?');
        values.push(null);
      } else if (VALID_PAYMENT.includes(Jenis_pembayaran)) {
        updates.push('Jenis_pembayaran = ?');
        values.push(Jenis_pembayaran);
      } else {
        return NextResponse.json(
          { error: `Invalid Jenis_pembayaran. Allowed: ${VALID_PAYMENT.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (status_proses !== undefined) {
      if (VALID_STATUS.includes(status_proses)) {
        updates.push('status_proses = ?');
        values.push(status_proses);
      } else {
        return NextResponse.json(
          { error: `Invalid status_proses. Allowed: ${VALID_STATUS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (isLunas !== undefined) {
      const paid = Boolean(isLunas);
      updates.push('isLunas = ?');
      values.push(paid ? 1 : 0);

      if (paid) {
        updates.push('Lunas_date = ?');
        values.push(nowSQL());

        // saat lunas, paksa completed
        updates.push('status_proses = ?');
        values.push('completed');
      } else {
        // kalau dibatalkan lunasnya, null-kan tanggal
        updates.push('Lunas_date = ?');
        values.push(null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE Billing_Farmasi
       SET ${updates.join(', ')}
       WHERE ID_billing_farmasi = ?`,
      [...values, ID_billing_farmasi]
    );

    return NextResponse.json({
      success: true,
      message: 'Billing farmasi updated successfully',
    });
  } catch (error) {
    console.error('Error updating billing farmasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
