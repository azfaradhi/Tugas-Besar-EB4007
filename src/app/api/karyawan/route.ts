import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let sql: string;
    const params: any[] = [];

    if (role === 'doctor') {
      sql = `
        SELECT
          k.*,
          d.Spesialis,
          d.STR,
          d.Status,
          d.Shift,
          d.ID_Department
        FROM Karyawan k
        INNER JOIN Dokter d ON k.ID_karyawan = d.ID_karyawan
        WHERE 1=1
      `;
    } else if (role === 'resepsionis') {
      sql = `
        SELECT k.*
        FROM Karyawan k
        INNER JOIN Resepsionis r ON k.ID_karyawan = r.ID_karyawan
        WHERE 1=1
      `;
    } else if (role === 'operasional') {
      sql = `
        SELECT k.*
        FROM Karyawan k
        INNER JOIN Operasional o ON k.ID_karyawan = o.ID_karyawan
        WHERE 1=1
      `;
    } else if (role === 'perawat') {
      sql = `
        SELECT k.*, p.Shift
        FROM Karyawan k
        INNER JOIN Perawat p ON k.ID_karyawan = p.ID_karyawan
        WHERE 1=1
      `;
    } else {
      sql = 'SELECT * FROM Karyawan WHERE 1=1';
    }

    const tableAlias = role ? 'k' : '';
    const dot = role ? '.' : '';

    if (id) {
      sql += ` AND ${tableAlias}${dot}ID_karyawan = ?`;
      params.push(id);
    }

    if (search) {
      sql += ` AND (${tableAlias}${dot}Nama LIKE ? OR ${tableAlias}${dot}No_telpon LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY ${tableAlias}${dot}Nama ASC`;

    const karyawans = await query(sql, params);

    return NextResponse.json({
      success: true,
      karyawans
    });
  } catch (error) {
    console.error('Error fetching karyawan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch karyawan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      Nama,
      Tanggal_lahir,
      Jenis_kelamin,
      No_telpon,
      Alamat,
      role,
      Spesialis,
      STR,
      ID_Department,
      Shift,
      createUser,
      username,
      password
    } = body;

    if (!Nama || !Tanggal_lahir || !Jenis_kelamin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const birthDate = new Date(Tanggal_lahir);
    const today = new Date();
    let Umur = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      Umur--;
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Karyawan'
    );
    const count = countResult[0].count;
    const ID_karyawan = `K${String(count + 1).padStart(3, '0')}`;

    let user_id = null;

    if (createUser && username && password && role) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      let userRole = 'staff_registration';
      if (role === 'doctor') {
        userRole = 'doctor';
      } else if (role === 'resepsionis') {
        userRole = 'staff_registration';
      } else if (role === 'operasional') {
        userRole = 'staff_registration';
      } else if (role === 'perawat') {
        userRole = 'staff_registration';
      }

      const userResult: any = await query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, userRole]
      );
      user_id = userResult.insertId;
    }

    await query(
      `INSERT INTO Karyawan
       (ID_karyawan, user_id, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_karyawan, user_id, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon || null, Alamat || null]
    );

    if (role === 'doctor') {
      await query(
        'INSERT INTO Dokter (ID_karyawan, Spesialis, STR, ID_Department, Status, Shift) VALUES (?, ?, ?, ?, ?, ?)',
        [ID_karyawan, Spesialis || null, STR || null, ID_Department || null, 'Aktif', Shift || 'Pagi']
      );
    } else if (role === 'resepsionis') {
      await query(
        'INSERT INTO Resepsionis (ID_karyawan) VALUES (?)',
        [ID_karyawan]
      );
    } else if (role === 'operasional') {
      await query(
        'INSERT INTO Operasional (ID_karyawan) VALUES (?)',
        [ID_karyawan]
      );
    } else if (role === 'perawat') {
      await query(
        'INSERT INTO Perawat (ID_karyawan, Shift) VALUES (?, ?)',
        [ID_karyawan, Shift || 'Pagi']
      );
    }

    return NextResponse.json({
      success: true,
      ID_karyawan,
      user_id,
      message: 'Karyawan created successfully'
    });
  } catch (error: any) {
    console.error('Error creating karyawan:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create karyawan' },
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
    const { ID_karyawan, Tanggal_lahir, ...updates } = body;

    if (!ID_karyawan) {
      return NextResponse.json(
        { error: 'ID_karyawan is required' },
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

    if (setParts.length > 0) {
      await query(
        `UPDATE Karyawan SET ${setParts.join(', ')} WHERE ID_karyawan = ?`,
        [...values, ID_karyawan]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Karyawan updated successfully'
    });
  } catch (error) {
    console.error('Error updating karyawan:', error);
    return NextResponse.json(
      { error: 'Failed to update karyawan' },
      { status: 500 }
    );
  }
}
