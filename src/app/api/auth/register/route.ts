import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      username,
      password,
      name,
      dateOfBirth,
      gender,
      bloodType,
      phone,
      email,
      address,
      emergencyContact,
      emergencyPhone
    } = await request.json();

    if (!username || !password || !name || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: 'Username, password, nama, tanggal lahir, dan jenis kelamin harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const [existingUsers] = await db.query<any[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username sudah terdaftar' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const [lastPatients] = await db.query<any[]>(
      'SELECT ID_pasien FROM Pasien WHERE ID_pasien LIKE ? ORDER BY ID_pasien DESC LIMIT 1',
      [`P${year}${month}%`]
    );

    let sequential = 1;
    if (lastPatients.length > 0) {
      const lastNumber = lastPatients[0].ID_pasien;
      const lastSequential = parseInt(lastNumber.slice(-4));
      sequential = lastSequential + 1;
    }

    const patientNumber = `P${year}${month}${sequential.toString().padStart(4, '0')}`;

    const [userResult] = await db.query<any>(
      'INSERT INTO users (username, password, role, profile_id) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, 'patient', patientNumber]
    );

    const userId = userResult.insertId;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    await db.query(
      `INSERT INTO Pasien
       (ID_pasien, user_id, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientNumber,
        userId,
        name,
        dateOfBirth,
        age,
        gender,
        phone || null,
        address || null,
        bloodType || null
      ]
    );

    return NextResponse.json({
      message: 'Registrasi berhasil',
      patientNumber
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
