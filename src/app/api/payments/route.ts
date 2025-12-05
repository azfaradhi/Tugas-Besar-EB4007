import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data billing
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_pasien = searchParams.get('patientId');
    const ID_billing = searchParams.get('id');

    let query = `
      SELECT
        b.*,
        p.Nama as patient_name,
        p.NIK
      FROM Billing b
      JOIN Pasien p ON b.ID_pasien = p.ID_pasien
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_billing) {
      conditions.push('b.ID_billing = ?');
      params.push(ID_billing);
    }

    if (ID_pasien) {
      conditions.push('b.ID_pasien = ?');
      params.push(ID_pasien);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.Lunas_date DESC';

    const [payments] = await db.query(query, params);

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Membuat billing baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID_pasien, Jenis_pembayaran, isLunas } = body;

    if (!ID_pasien || !Jenis_pembayaran) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate ID_billing
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Billing'
    );
    const count = countResult[0].count;
    const ID_billing = `B${String(count + 1).padStart(6, '0')}`;

    const Lunas_date = isLunas ? new Date() : null;

    await db.query(
      `INSERT INTO Billing (ID_billing, ID_pasien, Lunas_date, Jenis_pembayaran, isLunas)
       VALUES (?, ?, ?, ?, ?)`,
      [ID_billing, ID_pasien, Lunas_date, Jenis_pembayaran, isLunas || false]
    );

    return NextResponse.json({
      message: 'Billing berhasil dibuat',
      ID_billing
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT - Update billing
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID_billing, isLunas, Jenis_pembayaran } = body;

    if (!ID_billing) {
      return NextResponse.json(
        { error: 'ID billing wajib dikirim' },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (isLunas !== undefined) {
      updateFields.push('isLunas = ?');
      params.push(isLunas);

      if (isLunas) {
        updateFields.push('Lunas_date = NOW()');
      }
    }

    if (Jenis_pembayaran !== undefined) {
      updateFields.push('Jenis_pembayaran = ?');
      params.push(Jenis_pembayaran);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    params.push(ID_billing);

    const [result] = await db.query(
      `UPDATE Billing SET ${updateFields.join(', ')} WHERE ID_billing = ?`,
      params
    );

    // @ts-ignore
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Billing tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Billing berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
