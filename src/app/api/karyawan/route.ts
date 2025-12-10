import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const nik = searchParams.get('nik');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let sql = 'SELECT * FROM Karyawan WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND ID_karyawan = ?';
      params.push(id);
    }

    if (nik) {
      sql += ' AND NIK = ?';
      params.push(nik);
    }

    if (search) {
      sql += ' AND (Nama LIKE ? OR NIK LIKE ? OR No_telpon LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      sql += ' AND Role = ?';
      params.push(role);
    }

    sql += ' ORDER BY Nama ASC';

    const karyawans = await query(sql, params);

    return NextResponse.json({
      success: true,
      karyawans
    });
  } catch (error) {
    console.error('Error fetching karyawan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch karyawan' },
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
      Nama,
      NIK,
      No_telpon,
      Email,
      Alamat,
      Role
    } = body;

    if (!Nama || !NIK || !Role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Karyawan'
    );
    const count = countResult[0].count;
    const ID_karyawan = `K${String(count + 1).padStart(6, '0')}`;

    await query(
      `INSERT INTO Karyawan
       (ID_karyawan, Nama, NIK, No_telpon, Email, Alamat, Role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_karyawan, Nama, NIK, No_telpon || null, Email || null, Alamat || null, Role]
    );

    return NextResponse.json({
      success: true,
      ID_karyawan,
      message: 'Karyawan created successfully'
    });
  } catch (error: any) {
    console.error('Error creating karyawan:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'NIK already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create karyawan' },
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
    const { ID_karyawan, ...updates } = body;

    if (!ID_karyawan) {
      return NextResponse.json(
        { error: 'ID_karyawan is required' },
        { status: 400 }
      );
    }

    const setParts = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);

    await query(
      `UPDATE Karyawan SET ${setParts.join(', ')} WHERE ID_karyawan = ?`,
      [...values, ID_karyawan]
    );

    return NextResponse.json({
      success: true,
      message: 'Karyawan updated successfully'
    });
  } catch (error) {
    console.error('Error updating karyawan:', error);
    return NextResponse.json(
      { error: 'Failed to update karyawan' },
      { status: 500 }
    );
  }
}
