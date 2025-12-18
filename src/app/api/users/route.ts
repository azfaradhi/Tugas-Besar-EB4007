import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyAuth } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isValid || authResult.user?.role !== 'staff_registration') {
      return NextResponse.json(
        { error: 'Unauthorized. Only registration staff can create users.' },
        { status: 403 }
      );
    }

    const {
      username,
      password,
      role,
      profileData
    } = await request.json();

    // Validation
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const validRoles = ['doctor', 'staff_pharmacy', 'staff_lab', 'staff_cashier'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Allowed: doctor, staff_pharmacy, staff_lab, staff_cashier' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const [existingUsers] = await db.query<any[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create user account
      const [userResult] = await connection.query<any>(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role]
      );

      const userId = userResult.insertId;
      let profileId = null;

      // Create corresponding profile based on role
      if (role === 'doctor') {
        if (!profileData?.Nama || !profileData?.ID_Department) {
          throw new Error('Doctor profile requires: Nama, ID_Department');
        }

        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const [countResult] = await connection.query<any[]>(
          'SELECT COUNT(*) as count FROM Karyawan WHERE ID_karyawan LIKE ?',
          [`K${year}${month}%`]
        );
        const sequence = String((countResult[0].count || 0) + 1).padStart(4, '0');
        profileId = `K${year}${month}${sequence}`;

        // Insert into Karyawan
        await connection.query(
          `INSERT INTO Karyawan (
            ID_karyawan, user_id, Nama, Tanggal_lahir, Umur,
            Jenis_kelamin, No_telpon, Alamat
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            userId,
            profileData.Nama,
            profileData.Tanggal_Lahir || '1990-01-01',
            profileData.Umur || 30,
            profileData.Jenis_Kelamin || 'Laki-laki',
            profileData.No_Telepon || '-',
            profileData.Alamat || '-'
          ]
        );

        // Insert into Dokter
        await connection.query(
          `INSERT INTO Dokter (
            ID_karyawan, ID_Department, Spesialis, STR, Status, Shift
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            profileData.ID_Department,
            profileData.Spesialisasi || 'Umum',
            profileData.Nomor_Lisensi || profileData.STR || '-',
            'Aktif',
            profileData.Shift || 'Pagi'
          ]
        );

      } else if (role === 'staff_pharmacy' || role === 'staff_lab' || role === 'staff_cashier') {
        if (!profileData?.Nama) {
          throw new Error('Staff profile requires: Nama');
        }

        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const [countResult] = await connection.query<any[]>(
          'SELECT COUNT(*) as count FROM Karyawan WHERE ID_karyawan LIKE ?',
          [`K${year}${month}%`]
        );
        const sequence = String((countResult[0].count || 0) + 1).padStart(4, '0');
        profileId = `K${year}${month}${sequence}`;

        // Insert into Karyawan
        await connection.query(
          `INSERT INTO Karyawan (
            ID_karyawan, user_id, Nama, Tanggal_lahir, Umur,
            Jenis_kelamin, No_telpon, Alamat
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            userId,
            profileData.Nama,
            profileData.Tanggal_Lahir || '1990-01-01',
            profileData.Umur || 30,
            profileData.Jenis_Kelamin || 'Laki-laki',
            profileData.No_Telepon || profileData.No_telpon || '-',
            profileData.Alamat || '-'
          ]
        );

        // Create specific staff profiles based on role
        if (role === 'staff_pharmacy') {
          // Check if Resepsionis table exists or create pharmacy staff record
          // For now, just mark in Karyawan table
        } else if (role === 'staff_lab') {
          // Similar for lab staff
        } else if (role === 'staff_cashier') {
          // Similar for cashier
        }
      }

      await connection.commit();

      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: userId,
          username,
          role,
          profileId
        }
      }, { status: 201 });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    console.log('GET /api/users - Auth result:', { 
      isValid: authResult.isValid, 
      role: authResult.user?.role 
    });
    
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 403 }
      );
    }

    // Allow all authenticated users to view user list
    // But only staff_registration can create users (POST endpoint)

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = `
      SELECT 
        u.id,
        u.username,
        u.role,
        u.created_at,
        k.ID_karyawan as profile_id,
        k.Nama,
        k.Jenis_kelamin,
        k.No_telpon,
        k.Alamat,
        d.Spesialis,
        d.ID_Department
      FROM users u
      LEFT JOIN Karyawan k ON u.id = k.user_id
      LEFT JOIN Dokter d ON k.ID_karyawan = d.ID_karyawan
      WHERE u.role != 'patient'
    `;

    const params: any[] = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await db.query<any[]>(query, params);

    return NextResponse.json({ users }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
