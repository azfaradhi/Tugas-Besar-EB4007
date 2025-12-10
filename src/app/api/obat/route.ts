import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const kategori = searchParams.get('kategori');

    let sql = 'SELECT * FROM Obat WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND ID_obat = ?';
      params.push(id);
    }

    if (search) {
      sql += ' AND Nama LIKE ?';
      params.push(`%${search}%`);
    }

    if (kategori) {
      sql += ' AND Kategori = ?';
      params.push(kategori);
    }

    sql += ' ORDER BY Nama ASC';

    const obats = await query(sql, params);

    return NextResponse.json({
      success: true,
      obats
    });
  } catch (error) {
    console.error('Error fetching obat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch obat' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || auth.user?.role !== 'staff_pharmacy') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { Nama, Kategori } = body;

    if (!Nama || !Kategori) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Obat'
    );
    const count = countResult[0].count;
    const ID_obat = `O${String(count + 1).padStart(6, '0')}`;

    await query(
      'INSERT INTO Obat (ID_obat, Nama, Kategori) VALUES (?, ?, ?)',
      [ID_obat, Nama, Kategori]
    );

    return NextResponse.json({
      success: true,
      ID_obat,
      message: 'Obat created successfully'
    });
  } catch (error) {
    console.error('Error creating obat:', error);
    return NextResponse.json(
      { error: 'Failed to create obat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || auth.user?.role !== 'staff_pharmacy') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ID_obat, ...updates } = body;

    if (!ID_obat) {
      return NextResponse.json(
        { error: 'ID_obat is required' },
        { status: 400 }
      );
    }

    const setParts = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);

    await query(
      `UPDATE Obat SET ${setParts.join(', ')} WHERE ID_obat = ?`,
      [...values, ID_obat]
    );

    return NextResponse.json({
      success: true,
      message: 'Obat updated successfully'
    });
  } catch (error) {
    console.error('Error updating obat:', error);
    return NextResponse.json(
      { error: 'Failed to update obat' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || auth.user?.role !== 'staff_pharmacy') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID_obat is required' },
        { status: 400 }
      );
    }

    await query('DELETE FROM Obat WHERE ID_obat = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Obat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting obat:', error);
    return NextResponse.json(
      { error: 'Failed to delete obat' },
      { status: 500 }
    );
  }
}
