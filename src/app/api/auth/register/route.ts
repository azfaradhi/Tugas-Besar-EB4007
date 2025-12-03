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

    // Validasi input
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

    // Cek apakah username sudah ada
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const [userResult] = await db.query<any>(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'patient']
    );

    const userId = userResult.insertId;

    // Generate patient number (format: P + year + month + sequential number)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get last patient number for this month
    const [lastPatients] = await db.query<any[]>(
      'SELECT patient_number FROM patients WHERE patient_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`P${year}${month}%`]
    );

    let sequential = 1;
    if (lastPatients.length > 0) {
      const lastNumber = lastPatients[0].patient_number;
      const lastSequential = parseInt(lastNumber.slice(-4));
      sequential = lastSequential + 1;
    }

    const patientNumber = `P${year}${month}${sequential.toString().padStart(4, '0')}`;

    // Insert patient
    await db.query(
      `INSERT INTO patients
       (user_id, patient_number, name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, emergency_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        patientNumber,
        name,
        dateOfBirth,
        gender,
        bloodType || null,
        phone || null,
        email || null,
        address || null,
        emergencyContact || null,
        emergencyPhone || null
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
