import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const available = searchParams.get('available');

    let sql = 'SELECT * FROM Ruangan WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND ID_ruangan = ?';
      params.push(id);
    }

    if (available === 'true') {
      sql += ' AND isAvailable = 1';
    } else if (available === 'false') {
      sql += ' AND isAvailable = 0';
    }

    sql += ' ORDER BY ID_ruangan ASC';

    const ruangans = await query(sql, params);

    return NextResponse.json({
      success: true,
      ruangans
    });
  } catch (error) {
    console.error('Error fetching ruangan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ruangan' },
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
    const { isAvailable } = body;

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Ruangan'
    );
    const count = countResult[0].count;
    const ID_ruangan = `R${String(count + 1).padStart(6, '0')}`;

    await query(
      'INSERT INTO Ruangan (ID_ruangan, isAvailable) VALUES (?, ?)',
      [ID_ruangan, isAvailable ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      ID_ruangan,
      message: 'Ruangan created successfully'
    });
  } catch (error) {
    console.error('Error creating ruangan:', error);
    return NextResponse.json(
      { error: 'Failed to create ruangan' },
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
    const { ID_ruangan, isAvailable } = body;

    if (!ID_ruangan) {
      return NextResponse.json(
        { error: 'ID_ruangan is required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE Ruangan SET isAvailable = ? WHERE ID_ruangan = ?',
      [isAvailable ? 1 : 0, ID_ruangan]
    );

    return NextResponse.json({
      success: true,
      message: 'Ruangan updated successfully'
    });
  } catch (error) {
    console.error('Error updating ruangan:', error);
    return NextResponse.json(
      { error: 'Failed to update ruangan' },
      { status: 500 }
    );
  }
}
