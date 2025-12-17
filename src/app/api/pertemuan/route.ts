import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const tanggal = searchParams.get('tanggal')
    const status = searchParams.get('status')

    let sql = `
      SELECT
        a.ID_pertemuan,
        a.ID_Pasien,
        a.ID_Dokter,
        DATE_FORMAT(a.Tanggal, '%Y-%m-%d') AS Tanggal,
        a.Waktu_mulai,
        a.Waktu_selesai,
        a.status,
        p.Nama as patient_name,
        p.ID_pasien as patient_number,
        k.Nama as doctor_name,
        d.Spesialis as specialization,
        a.ID_ruangan,
        a.ID_Perawat,
        hp.ID_hasil as has_hasil_pemeriksaan
      FROM Pertemuan a
      JOIN Pasien p ON p.ID_pasien = a.ID_Pasien
      JOIN Dokter d ON d.ID_karyawan = a.ID_Dokter
      JOIN Karyawan k ON k.ID_karyawan = d.ID_karyawan
      WHERE 1=1
    `
    const params: any[] = []

    if (id) { sql += ' AND a.ID_pertemuan = ?'; params.push(Number(id)) }
    if (patientId) { sql += ' AND a.ID_Pasien = ?'; params.push(Number(patientId)) }
    if (doctorId) { sql += ' AND a.ID_Dokter = ?'; params.push(Number(doctorId)) }
    if (tanggal) { sql += ' AND a.Tanggal = ?'; params.push(tanggal) }
    if (status) { sql += ' AND a.status = ?'; params.push(status) }

    sql += ' ORDER BY a.Tanggal DESC, a.Waktu_mulai DESC'

    const pertemuans = await query(sql, params)

    return NextResponse.json({ success: true, pertemuans })
  } catch (error) {
    console.error('Error fetching pertemuan:', error)
    return NextResponse.json({ error: 'Failed to fetch pertemuan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ID_Pasien, ID_Dokter, Tanggal, Waktu_mulai } = body

    if (!ID_Pasien || !ID_Dokter || !Tanggal || !Waktu_mulai) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingBooking: any = await query(
      `SELECT COUNT(*) as count FROM Pertemuan
       WHERE ID_Dokter = ?
       AND Tanggal = ?
       AND Waktu_mulai = ?`,
      [ID_Dokter, Tanggal, Waktu_mulai]
    )

    if (exists.c > 0) {
      return NextResponse.json({ error: 'Dokter sudah ada jadwal' }, { status: 409 })
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Pertemuan'
    );
    const count = countResult[0].count;
    const ID_pertemuan = `PRT${String(count + 1).padStart(3, '0')}`;

    // Auto-generate ruangan berdasarkan ID dokter (RXXX dimana XXX = ID dokter)
    const ID_ruangan = `R${ID_Dokter.replace('K', '')}`;

    const tanggalFormatted = Tanggal;

    // Insert ke Pertemuan
    const result: any = await query(
      `INSERT INTO Pertemuan
       (ID_pertemuan, ID_Pasien, ID_Dokter, ID_ruangan, Tanggal, Waktu_mulai, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_pertemuan, ID_Pasien, ID_Dokter, ID_ruangan, tanggalFormatted, Waktu_mulai, 'scheduled']
    );

    // Insert ke Jadwal_Praktik juga
    const countJadwal: any = await query(
      'SELECT COUNT(*) as count FROM Jadwal_Praktik'
    );
    const countJ = countJadwal[0].count;
    const ID_jadwal = `JDW${String(countJ + 1).padStart(3, '0')}`;

    // Combine tanggal dan waktu untuk Date column di Jadwal_Praktik
    const dateTime = `${tanggalFormatted} ${Waktu_mulai}`;

    await query(
      `INSERT INTO Jadwal_Praktik (ID_jadwal, ID_Dokter, ID_ruangan, Date)
       VALUES (?, ?, ?, ?)`,
      [ID_jadwal, ID_Dokter, ID_ruangan, dateTime]
    );

    return NextResponse.json({
      success: true,
      ID_pertemuan: ID_pertemuan,
      ID_ruangan: ID_ruangan,
      message: 'Pertemuan berhasil dibuat'
    });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create pertemuan' }, { status: 500 })
  }
}


export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { ID_pertemuan, ...updates } = body

    if (setParts.length > 0) {
      await query(
        `UPDATE Pertemuan SET ${setParts.join(', ')} WHERE ID_pertemuan = ?`,
        [...values, ID_pertemuan]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pertemuan updated successfully'
    });
  } catch (error) {
    console.error('Error updating pertemuan:', error);
    return NextResponse.json(
      { error: 'Failed to update pertemuan' },
      { status: 500 }
    );
  }
}
