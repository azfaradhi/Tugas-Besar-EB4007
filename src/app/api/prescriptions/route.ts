import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil data obat yang diresepkan
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_hasil = searchParams.get('hasilId');

    let query = `
      SELECT
        o.*,
        ho.ID_hasil
      FROM Obat o
      JOIN Hasil_Obat ho ON o.ID_obat = ho.ID_Obat
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_hasil) {
      conditions.push('ho.ID_hasil = ?');
      params.push(ID_hasil);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [prescriptions] = await db.query(query, params);

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Menambahkan obat ke hasil pemeriksaan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ID_hasil, ID_Obat } = body;

    if (!ID_hasil || !ID_Obat) {
      return NextResponse.json(
        { error: "ID hasil dan ID obat wajib diisi" },
        { status: 400 }
      );
    }

    // Check if already exists
    const [existing]: any = await db.query(
      'SELECT * FROM Hasil_Obat WHERE ID_hasil = ? AND ID_Obat = ?',
      [ID_hasil, ID_Obat]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Obat sudah ditambahkan ke hasil pemeriksaan ini" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO Hasil_Obat (ID_hasil, ID_Obat) VALUES (?, ?)`,
      [ID_hasil, ID_Obat]
    );

    return NextResponse.json({
      message: "Obat berhasil ditambahkan ke resep"
    });

  } catch (error: any) {
    console.error("Create prescription error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
