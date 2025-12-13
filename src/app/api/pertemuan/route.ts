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
        p.Nama AS patient_name,
        k.Nama AS doctor_name,
        d.Spesialis
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

    // cek bentrok jadwal
    const [exists]: any = await query(
      `SELECT COUNT(*) AS c FROM Pertemuan
       WHERE ID_Dokter = ? AND Tanggal = ? AND Waktu_mulai = ?`,
      [ID_Dokter, Tanggal, Waktu_mulai]
    )

    if (exists.c > 0) {
      return NextResponse.json({ error: 'Dokter sudah ada jadwal' }, { status: 409 })
    }

    const [result]: any = await query(
      `INSERT INTO Pertemuan (ID_Pasien, ID_Dokter, Tanggal, Waktu_mulai)
       VALUES (?, ?, ?, ?)`,
      [ID_Pasien, ID_Dokter, Tanggal, Waktu_mulai]
    )

    return NextResponse.json({
      success: true,
      ID_pertemuan: result.insertId
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create pertemuan' }, { status: 500 })
  }
}


export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { ID_pertemuan, ...updates } = body

  await query(
    `UPDATE Pertemuan SET ${Object.keys(updates).map(k => `${k}=?`).join(', ')}
     WHERE ID_pertemuan = ?`,
    [...Object.values(updates), ID_pertemuan]
  )

  return NextResponse.json({ success: true })
}
