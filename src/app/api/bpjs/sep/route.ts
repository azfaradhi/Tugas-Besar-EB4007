import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const nomorSep = searchParams.get('nomorSep');
    const nomorKartu = searchParams.get('nomorKartu');

    let sql = `
      SELECT
        s.*,
        p.Nama as nama_pasien,
        p.NIK,
        p.Tanggal_lahir,
        per.Tanggal as tanggal_pertemuan,
        d.ID_karyawan as id_dokter,
        k.Nama as nama_dokter
      FROM SEP s
      LEFT JOIN Pasien p ON s.ID_pasien = p.ID_pasien
      LEFT JOIN Pertemuan per ON s.ID_pertemuan = per.ID_pertemuan
      LEFT JOIN Dokter d ON per.ID_Dokter = d.ID_karyawan
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND s.ID_sep = ?';
      params.push(id);
    }

    if (nomorSep) {
      sql += ' AND s.Nomor_sep = ?';
      params.push(nomorSep);
    }

    if (nomorKartu) {
      sql += ' AND s.Nomor_kartu_bpjs = ?';
      params.push(nomorKartu);
    }

    sql += ' ORDER BY s.Tanggal_sep DESC';

    const seps = await query(sql, params);

    return NextResponse.json({
      success: true,
      seps
    });
  } catch (error) {
    console.error('Error fetching SEP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEP' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || (auth.user?.role !== 'staff_registration' && auth.user?.role !== 'doctor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ID_pasien,
      ID_pertemuan,
      Nomor_kartu_bpjs,
      Kode_ppk,
      Kode_poli,
      Kode_diagnosa,
      Catatan,
      isRujukan,
      Asal_rujukan,
      Nomor_rujukan,
      Tanggal_rujukan
    } = body;

    if (!ID_pasien || !ID_pertemuan || !Nomor_kartu_bpjs || !Kode_ppk) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM SEP'
    );
    const count = countResult[0].count;
    const ID_sep = `SEP${String(count + 1).padStart(6, '0')}`;

    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');
    const Nomor_sep = `${Kode_ppk}${year}${month}${day}${sequence}`;

    const Tanggal_sep = new Date().toISOString().split('T')[0];

    await query(
      `INSERT INTO SEP
       (ID_sep, ID_pasien, ID_pertemuan, Nomor_sep, Nomor_kartu_bpjs, Tanggal_sep,
        Kode_ppk, Kode_poli, Kode_diagnosa, Catatan, isRujukan, Asal_rujukan,
        Nomor_rujukan, Tanggal_rujukan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_sep,
        ID_pasien,
        ID_pertemuan,
        Nomor_sep,
        Nomor_kartu_bpjs,
        Tanggal_sep,
        Kode_ppk,
        Kode_poli || null,
        Kode_diagnosa || null,
        Catatan || null,
        isRujukan ? 1 : 0,
        Asal_rujukan || null,
        Nomor_rujukan || null,
        Tanggal_rujukan || null
      ]
    );

    return NextResponse.json({
      success: true,
      ID_sep,
      Nomor_sep,
      message: 'SEP created successfully'
    });
  } catch (error) {
    console.error('Error creating SEP:', error);
    return NextResponse.json(
      { error: 'Failed to create SEP' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || (auth.user?.role !== 'staff_registration' && auth.user?.role !== 'doctor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ID_sep, ...updates } = body;

    if (!ID_sep) {
      return NextResponse.json(
        { error: 'ID_sep is required' },
        { status: 400 }
      );
    }

    const setParts = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);

    await query(
      `UPDATE SEP SET ${setParts.join(', ')} WHERE ID_sep = ?`,
      [...values, ID_sep]
    );

    return NextResponse.json({
      success: true,
      message: 'SEP updated successfully'
    });
  } catch (error) {
    console.error('Error updating SEP:', error);
    return NextResponse.json(
      { error: 'Failed to update SEP' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid || (auth.user?.role !== 'staff_registration' && auth.user?.role !== 'doctor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID_sep is required' },
        { status: 400 }
      );
    }

    await query('DELETE FROM SEP WHERE ID_sep = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'SEP deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SEP:', error);
    return NextResponse.json(
      { error: 'Failed to delete SEP' },
      { status: 500 }
    );
  }
}
