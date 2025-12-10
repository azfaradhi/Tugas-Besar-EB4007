import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const nik = searchParams.get('nik');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM Pasien WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND ID_pasien = ?';
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

    sql += ' ORDER BY Nama ASC';

    const pasiens = await query(sql, params);

    return NextResponse.json({
      success: true,
      pasiens
    });
  } catch (error) {
    console.error('Error fetching pasien:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pasien' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      Nama,
      NIK,
      Tanggal_lahir,
      Jenis_kelamin,
      No_telpon,
      Alamat,
      Golongan_darah,
      Riwayat_penyakit,
      Nama_ibu_kandung
    } = body;

    if (!Nama || !NIK || !Tanggal_lahir || !Jenis_kelamin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Pasien'
    );
    const count = countResult[0].count;
    const ID_pasien = `P${String(count + 1).padStart(6, '0')}`;

    const birthDate = new Date(Tanggal_lahir);
    const today = new Date();
    let Umur = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      Umur--;
    }

    await query(
      `INSERT INTO Pasien
       (ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit, Nama_ibu_kandung)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon || null, Alamat || null, Golongan_darah || null, Riwayat_penyakit || null, Nama_ibu_kandung || null]
    );

    return NextResponse.json({
      success: true,
      ID_pasien,
      message: 'Pasien created successfully'
    });
  } catch (error: any) {
    console.error('Error creating pasien:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'NIK already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create pasien' },
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
    const { ID_pasien, Tanggal_lahir, ...updates } = body;

    if (!ID_pasien) {
      return NextResponse.json(
        { error: 'ID_pasien is required' },
        { status: 400 }
      );
    }

    if (Tanggal_lahir) {
      const birthDate = new Date(Tanggal_lahir);
      const today = new Date();
      let Umur = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        Umur--;
      }
      updates.Tanggal_lahir = Tanggal_lahir;
      updates.Umur = Umur;
    }

    const setParts = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);

    await query(
      `UPDATE Pasien SET ${setParts.join(', ')} WHERE ID_pasien = ?`,
      [...values, ID_pasien]
    );

    return NextResponse.json({
      success: true,
      message: 'Pasien updated successfully'
    });
  } catch (error) {
    console.error('Error updating pasien:', error);
    return NextResponse.json(
      { error: 'Failed to update pasien' },
      { status: 500 }
    );
  }
}
