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
        k.No_telpon,
        k.Alamat,
        k.Jenis_kelamin
      FROM Perawat p
      LEFT JOIN Karyawan k ON p.ID_karyawan = k.ID_karyawan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND p.ID_karyawan = ?';
      params.push(id);
    }

    if (search) {
      sql += ' AND (k.Nama LIKE ? OR k.No_telpon LIKE ?)';
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
    const { ID_karyawan, Shift } = body;

    if (!ID_karyawan) {
      return NextResponse.json(
        { error: 'ID_karyawan is required' },
        { status: 400 }
      );
    }

    const karyawanExists: any = await query(
      'SELECT * FROM Karyawan WHERE ID_karyawan = ?',
      [ID_karyawan]
    );

    if (!karyawanExists || karyawanExists.length === 0) {
      return NextResponse.json(
        { error: 'Karyawan not found' },
        { status: 400 }
      );
    }

    await query(
      'INSERT INTO Perawat (ID_karyawan, Shift) VALUES (?, ?)',
      [ID_karyawan, Shift || 'Pagi']
    );

    return NextResponse.json({
      success: true,
      ID_karyawan,
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
    const { ID_karyawan, Shift } = body;

    if (!ID_karyawan) {
      return NextResponse.json(
        { error: 'ID_karyawan is required' },
        { status: 400 }
      );
    }

    if (Shift) {
      await query(
        'UPDATE Perawat SET Shift = ? WHERE ID_karyawan = ?',
        [Shift, ID_karyawan]
      );
    }

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
