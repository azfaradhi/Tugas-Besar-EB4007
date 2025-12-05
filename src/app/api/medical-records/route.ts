import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Mengambil hasil pemeriksaan
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ID_pertemuan = searchParams.get('pertemuanId');
    const ID_hasil = searchParams.get('id');

    let query = `
      SELECT
        hp.*,
        p.ID_Pasien,
        p.ID_Dokter,
        pas.Nama as patient_name,
        k.Nama as doctor_name
      FROM Hasil_Pemeriksaan hp
      JOIN Pertemuan p ON hp.ID_pertemuan = p.ID_pertemuan
      JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      JOIN Karyawan k ON p.ID_Dokter = k.ID_karyawan
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (ID_hasil) {
      conditions.push('hp.ID_hasil = ?');
      params.push(ID_hasil);
    }

    if (ID_pertemuan) {
      conditions.push('hp.ID_pertemuan = ?');
      params.push(ID_pertemuan);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [records] = await db.query(query, params);

    // Ambil obat-obat yang terkait dengan hasil pemeriksaan
    for (const record of records as any[]) {
      const [obatData] = await db.query(
        `SELECT o.* FROM Obat o
         JOIN Hasil_Obat ho ON o.ID_obat = ho.ID_Obat
         WHERE ho.ID_hasil = ?`,
        [record.ID_hasil]
      );
      record.obat_list = obatData;
    }

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Get medical records error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Membuat hasil pemeriksaan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ID_pertemuan,
      obat_ids // Array of obat IDs
    } = body;

    if (!ID_pertemuan) {
      return NextResponse.json(
        { error: "ID pertemuan wajib diisi." },
        { status: 400 }
      );
    }

    // Generate ID_hasil
    const [countResult]: any = await db.query(
      'SELECT COUNT(*) as count FROM Hasil_Pemeriksaan'
    );
    const count = countResult[0].count;
    const ID_hasil = `HP${String(count + 1).padStart(6, '0')}`;

    // Insert hasil pemeriksaan
    const [result]: any = await db.query(
      `INSERT INTO Hasil_Pemeriksaan (ID_hasil, ID_pertemuan)
       VALUES (?, ?)`,
      [ID_hasil, ID_pertemuan]
    );

    // Insert relasi dengan obat jika ada
    if (obat_ids && Array.isArray(obat_ids) && obat_ids.length > 0) {
      for (const ID_Obat of obat_ids) {
        await db.query(
          `INSERT INTO Hasil_Obat (ID_hasil, ID_Obat) VALUES (?, ?)`,
          [ID_hasil, ID_Obat]
        );
      }
    }

    return NextResponse.json({
      message: "Hasil pemeriksaan berhasil disimpan.",
      ID_hasil
    });
  } catch (error) {
    console.error("Create medical record error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
