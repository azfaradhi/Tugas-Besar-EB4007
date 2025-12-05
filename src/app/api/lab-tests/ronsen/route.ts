import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil hasil ronsen
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_ronsen = searchParams.get('id');
    const ID_hasil = searchParams.get('hasilId');

    let query = 'SELECT * FROM Ronsen';

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_ronsen) {
      conditions.push('ID_ronsen = ?');
      params.push(ID_ronsen);
    }

    if (ID_hasil) {
      conditions.push('ID_hasil = ?');
      params.push(ID_hasil);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [results] = await db.query(query, params);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Get ronsen error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Membuat hasil ronsen baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID_hasil, imgSrc } = body;

    if (!ID_hasil) {
      return NextResponse.json(
        { error: 'ID hasil pemeriksaan wajib diisi' },
        { status: 400 }
      );
    }

    // Generate ID_ronsen
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Ronsen'
    );
    const count = countResult[0].count;
    const ID_ronsen = `R${String(count + 1).padStart(6, '0')}`;

    await db.query(
      `INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc) VALUES (?, ?, ?)`,
      [ID_ronsen, ID_hasil, imgSrc]
    );

    return NextResponse.json({
      message: 'Hasil ronsen berhasil disimpan',
      ID_ronsen
    });
  } catch (error) {
    console.error('Create ronsen error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
