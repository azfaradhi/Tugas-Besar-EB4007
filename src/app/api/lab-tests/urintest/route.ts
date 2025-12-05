import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

// GET - Mengambil hasil uji urin
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_uji = searchParams.get('id');
    const ID_hasil = searchParams.get('hasilId');

    let query = 'SELECT * FROM UrinTest';

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_uji) {
      conditions.push('ID_uji = ?');
      params.push(ID_uji);
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
    console.error('Get urin test error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Membuat hasil uji urin baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ID_hasil,
      Warna,
      pH,
      Protein,
      Glukosa,
      Ketone,
      Bilirubin,
      Urobilin,
      Hemoglobin,
      Sel_darah_putih,
      Sel_darah_merah,
      Bakteri,
      Sel_epitheal,
      Crystals,
      Casts,
      Organisme_terisolasi,
      Antimicrobial,
      Trimethoprim,
      Cefuroxime,
      Amoxycillin_Clavulanic_acid,
      Cephalexin,
      Nitrofurantoin,
      Ciprofloxacin,
      Doxycycline,
      Gentamicin
    } = body;

    if (!ID_hasil) {
      return NextResponse.json(
        { error: 'ID hasil pemeriksaan wajib diisi' },
        { status: 400 }
      );
    }

    // Generate ID_uji
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM UrinTest'
    );
    const count = countResult[0].count;
    const ID_uji = `UT${String(count + 1).padStart(6, '0')}`;

    await db.query(
      `INSERT INTO UrinTest (
        ID_uji, ID_hasil, Warna, pH, Protein, Glukosa, Ketone, Bilirubin,
        Urobilin, Hemoglobin, Sel_darah_putih, Sel_darah_merah, Bakteri,
        Sel_epitheal, Crystals, Casts, Organisme_terisolasi, Antimicrobial,
        Trimethoprim, Cefuroxime, Amoxycillin_Clavulanic_acid, Cephalexin,
        Nitrofurantoin, Ciprofloxacin, Doxycycline, Gentamicin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_uji, ID_hasil, Warna, pH, Protein, Glukosa, Ketone, Bilirubin,
        Urobilin, Hemoglobin, Sel_darah_putih, Sel_darah_merah, Bakteri,
        Sel_epitheal, Crystals, Casts, Organisme_terisolasi, Antimicrobial,
        Trimethoprim, Cefuroxime, Amoxycillin_Clavulanic_acid, Cephalexin,
        Nitrofurantoin, Ciprofloxacin, Doxycycline, Gentamicin
      ]
    );

    return NextResponse.json({
      message: 'Hasil uji urin berhasil disimpan',
      ID_uji
    });
  } catch (error) {
    console.error('Create urin test error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
