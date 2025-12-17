import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let sql = `
      SELECT
        b.ID_billing,
        b.ID_pasien,
        b.ID_pertemuan,
        b.Total_harga,
        b.Lunas_date,
        b.Jenis_pembayaran,
        b.isLunas,
        pt.Nama as patient_name,
        pt.ID_pasien as patient_number,
        pt.No_telpon as phone
      FROM Billing b
      LEFT JOIN Pasien pt ON b.ID_pasien = pt.ID_pasien
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND b.ID_billing = ?';
      params.push(id);
    }

    if (patientId) {
      sql += ' AND b.ID_pasien = ?';
      params.push(patientId);
    }

    if (status) {
      sql += ' AND b.isLunas = ?';
      params.push(status === 'paid' ? 1 : 0);
    }

    sql += ' ORDER BY b.created_at DESC';

    const [billings] = await db.query(sql, params);

    return NextResponse.json({
      success: true,
      billings
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ID_pasien,
      ID_pertemuan,
      Total_harga,
      Jenis_pembayaran,
      isLunas
    } = body;

    if (!ID_pasien || !Total_harga) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Billing'
    );
    const count = countResult[0].count;
    const billing_id = `BIL${String(count + 1).padStart(3, '0')}`;

    const validPaymentMethods = ['Credit', 'Debit', 'Cash'];
    const paymentMethod = Jenis_pembayaran && validPaymentMethods.includes(Jenis_pembayaran)
      ? Jenis_pembayaran
      : null;

    const [result]: any = await db.query(
      `INSERT INTO Billing
       (ID_billing, ID_pasien, ID_pertemuan, Total_harga, Lunas_date, Jenis_pembayaran, isLunas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        billing_id,
        ID_pasien,
        ID_pertemuan || null,
        Total_harga,
        isLunas ? new Date() : null,
        paymentMethod,
        isLunas ? 1 : 0
      ]
    );

    return NextResponse.json({
      success: true,
      ID_billing: billing_id,
      message: 'Billing record created successfully'
    });
  } catch (error) {
    console.error('Error creating billing:', error);
    return NextResponse.json(
      { error: 'Failed to create billing record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ID_billing, isLunas, Jenis_pembayaran, Total_harga } = body;

    if (!ID_billing) {
      return NextResponse.json(
        { error: 'ID_billing is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (Total_harga !== undefined) {
      updates.push('Total_harga = ?');
      values.push(Total_harga);
    }

    if (Jenis_pembayaran !== undefined) {
      const validPaymentMethods = ['Credit', 'Debit', 'Cash'];
      if (validPaymentMethods.includes(Jenis_pembayaran)) {
        updates.push('Jenis_pembayaran = ?');
        values.push(Jenis_pembayaran);
      }
    }

    if (isLunas !== undefined) {
      updates.push('isLunas = ?');
      values.push(isLunas ? 1 : 0);

      if (isLunas) {
        const now = new Date();
        const lunas_date = now.toISOString().slice(0, 19).replace('T', ' ');
        updates.push('Lunas_date = ?');
        values.push(lunas_date);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE Billing SET ${updates.join(', ')} WHERE ID_billing = ?`,
      [...values, ID_billing]
    );

    return NextResponse.json({
      success: true,
      message: 'Billing updated successfully'
    });
  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json(
      { error: 'Failed to update billing' },
      { status: 500 }
    );
  }
}
