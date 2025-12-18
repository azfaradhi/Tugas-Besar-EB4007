import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Fetch inpatient records
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const inpatientId = searchParams.get('inpatientId');

    let query = `
      SELECT
        ri.*,
        p.Nama as nama_pasien,
        p.Tanggal_lahir,
        p.Umur,
        p.Jenis_kelamin,
        k.Nama as nama_dokter,
        r.ID_ruangan,
        r.Lantai,
        g.Nama as nama_gedung
      FROM Rawat_Inap ri
      LEFT JOIN Pasien p ON ri.ID_pasien = p.ID_pasien
      LEFT JOIN Karyawan k ON ri.ID_dokter = k.ID_karyawan
      LEFT JOIN Ruangan r ON ri.ID_ruangan = r.ID_ruangan
      LEFT JOIN Gedung g ON r.ID_gedung = g.ID_gedung
      WHERE 1=1
    `;

    const params: any[] = [];

    if (inpatientId) {
      query += ` AND ri.ID_rawat_inap = ?`;
      params.push(inpatientId);
    }

    if (patientId) {
      query += ` AND ri.ID_pasien = ?`;
      params.push(patientId);
    }

    if (status) {
      query += ` AND ri.Status = ?`;
      params.push(status);
    }

    query += ` ORDER BY ri.Tanggal_masuk DESC`;

    const [records] = await db.query<any[]>(query, params);

    return NextResponse.json({
      rawat_inap: records,
      count: records.length
    });

  } catch (error) {
    console.error('Get rawat inap records error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new inpatient admission
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create inpatient admissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      doctorId,
      hasilId,
      ruanganId,
      diagnosis,
      catatan
    } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Generate ID for rawat inap
    const [countResult] = await db.query<any[]>(
      'SELECT COUNT(*) as count FROM Rawat_Inap'
    );
    const count = countResult[0].count || 0;
    const inpatientId = `RI${String(count + 1).padStart(4, '0')}`;

    // Use provided doctorId or current user's profileId
    const finalDoctorId = doctorId || user.profileId;

    // Insert inpatient record
    await db.query(
      `INSERT INTO Rawat_Inap
       (ID_rawat_inap, ID_pasien, ID_dokter, ID_hasil, ID_ruangan,
        Tanggal_masuk, Status, Diagnosis, Catatan)
       VALUES (?, ?, ?, ?, ?, NOW(), 'aktif', ?, ?)`,
      [inpatientId, patientId, finalDoctorId, hasilId || null,
       ruanganId || null, diagnosis || null, catatan || null]
    );

    // Fetch the created record with joined data
    const [newRecord] = await db.query<any[]>(
      `SELECT
        ri.*,
        p.Nama as nama_pasien,
        k.Nama as nama_dokter,
        r.ID_ruangan,
        r.Lantai,
        g.Nama as nama_gedung
      FROM Rawat_Inap ri
      LEFT JOIN Pasien p ON ri.ID_pasien = p.ID_pasien
      LEFT JOIN Karyawan k ON ri.ID_dokter = k.ID_karyawan
      LEFT JOIN Ruangan r ON ri.ID_ruangan = r.ID_ruangan
      LEFT JOIN Gedung g ON r.ID_gedung = g.ID_gedung
      WHERE ri.ID_rawat_inap = ?`,
      [inpatientId]
    );

    return NextResponse.json({
      message: 'Inpatient admission created successfully',
      rawat_inap: newRecord[0]
    });

  } catch (error) {
    console.error('Create inpatient admission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update inpatient record
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can update inpatient records' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      inpatientId,
      status,
      tanggalKeluar,
      ruanganId,
      diagnosis,
      catatan
    } = body;

    if (!inpatientId) {
      return NextResponse.json(
        { error: 'Inpatient ID is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('Status = ?');
      values.push(status);
    }

    if (tanggalKeluar !== undefined) {
      updates.push('Tanggal_keluar = ?');
      values.push(tanggalKeluar);
    }

    if (ruanganId !== undefined) {
      updates.push('ID_ruangan = ?');
      values.push(ruanganId);
    }

    if (diagnosis !== undefined) {
      updates.push('Diagnosis = ?');
      values.push(diagnosis);
    }

    if (catatan !== undefined) {
      updates.push('Catatan = ?');
      values.push(catatan);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // If status is changed to 'selesai', set Tanggal_keluar if not already set
    if (status === 'selesai' && tanggalKeluar === undefined) {
      updates.push('Tanggal_keluar = NOW()');
    }

    values.push(inpatientId);

    await db.query(
      `UPDATE Rawat_Inap
       SET ${updates.join(', ')}
       WHERE ID_rawat_inap = ?`,
      values
    );

    // Fetch updated record
    const [updatedRecord] = await db.query<any[]>(
      `SELECT
        ri.*,
        p.Nama as nama_pasien,
        k.Nama as nama_dokter,
        r.ID_ruangan,
        r.Lantai,
        g.Nama as nama_gedung
      FROM Rawat_Inap ri
      LEFT JOIN Pasien p ON ri.ID_pasien = p.ID_pasien
      LEFT JOIN Karyawan k ON ri.ID_dokter = k.ID_karyawan
      LEFT JOIN Ruangan r ON ri.ID_ruangan = r.ID_ruangan
      LEFT JOIN Gedung g ON r.ID_gedung = g.ID_gedung
      WHERE ri.ID_rawat_inap = ?`,
      [inpatientId]
    );

    return NextResponse.json({
      message: 'Inpatient record updated successfully',
      rawat_inap: updatedRecord[0]
    });

  } catch (error) {
    console.error('Update inpatient record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inpatient record
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can delete inpatient records' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const inpatientId = searchParams.get('inpatientId');

    if (!inpatientId) {
      return NextResponse.json(
        { error: 'Inpatient ID is required' },
        { status: 400 }
      );
    }

    await db.query(
      'DELETE FROM Rawat_Inap WHERE ID_rawat_inap = ?',
      [inpatientId]
    );

    return NextResponse.json({
      message: 'Inpatient record deleted successfully'
    });

  } catch (error) {
    console.error('Delete inpatient record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
