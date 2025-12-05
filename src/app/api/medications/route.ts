import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data obat
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_obat = searchParams.get('id');

    let query = 'SELECT * FROM Obat';

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_obat) {
      conditions.push('ID_obat = ?');
      params.push(ID_obat);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY Nama ASC';

    const [medications] = await db.query(query, params);

    return NextResponse.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Menambahkan obat baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { Nama, Kategori } = body;

    if (!Nama || !Kategori) {
      return NextResponse.json(
        { error: 'Nama dan kategori obat wajib diisi' },
        { status: 400 }
      );
    }

    // Generate ID_obat
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Obat'
    );
    const count = countResult[0].count;
    const ID_obat = `O${String(count + 1).padStart(6, '0')}`;

    await db.query(
      `INSERT INTO Obat (ID_obat, Nama, Kategori) VALUES (?, ?, ?)`,
      [ID_obat, Nama, Kategori]
    );

    return NextResponse.json({
      message: 'Obat berhasil ditambahkan',
      ID_obat
    });
  } catch (error) {
    console.error('Create medication error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
