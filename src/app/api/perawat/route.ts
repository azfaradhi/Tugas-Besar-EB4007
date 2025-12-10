import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');

    let sql = `
      SELECT
        p.*,
        k.Nama,
        k.NIK,
        k.No_telpon,
        k.Email,
        k.Alamat
      FROM Perawat p
      LEFT JOIN Karyawan k ON p.ID_perawat = k.ID_karyawan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND p.ID_perawat = ?';
      params.push(id);
    }

    if (search) {
      sql += ' AND (k.Nama LIKE ? OR k.NIK LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY k.Nama ASC';

    const perawats = await query(sql, params);

    return NextResponse.json({
      success: true,
      perawats
    });
  } catch (error) {
    console.error('Error fetching perawat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch perawat' },
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
    const { ID_perawat } = body;

    if (!ID_perawat) {
      return NextResponse.json(
        { error: 'ID_perawat is required' },
        { status: 400 }
      );
    }

    const karyawanExists: any = await query(
      'SELECT * FROM Karyawan WHERE ID_karyawan = ? AND Role = ?',
      [ID_perawat, 'staff_nurse']
    );

    if (!karyawanExists || karyawanExists.length === 0) {
      return NextResponse.json(
        { error: 'Karyawan with role staff_nurse not found' },
        { status: 400 }
      );
    }

    await query(
      'INSERT INTO Perawat (ID_perawat, Nama) VALUES (?, ?)',
      [ID_perawat, karyawanExists[0].Nama]
    );

    return NextResponse.json({
      success: true,
      ID_perawat,
      message: 'Perawat created successfully'
    });
  } catch (error: any) {
    console.error('Error creating perawat:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Perawat already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create perawat' },
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
    const { ID_perawat, Nama } = body;

    if (!ID_perawat) {
      return NextResponse.json(
        { error: 'ID_perawat is required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE Perawat SET Nama = ? WHERE ID_perawat = ?',
      [Nama, ID_perawat]
    );

    return NextResponse.json({
      success: true,
      message: 'Perawat updated successfully'
    });
  } catch (error) {
    console.error('Error updating perawat:', error);
    return NextResponse.json(
      { error: 'Failed to update perawat' },
      { status: 500 }
    );
  }
}
