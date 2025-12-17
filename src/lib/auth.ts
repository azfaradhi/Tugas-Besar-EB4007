import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';
import { User } from '@/types';
import { NextRequest } from 'next/server';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  profileId?: string;  // Changed from number to string (VARCHAR(20))
  profileName?: string;
}

export interface VerifyAuthResult {
  isValid: boolean;
  user?: SessionUser;
}

// Fungsi untuk login
export async function login(username: string, password: string): Promise<SessionUser | null> {
  try {
    // Query user dari database
    const [rows] = await db.query<any[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0] as User;

    // Verifikasi password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    console.log('User found during login:', user);
    // Ambil data profile berdasarkan role dari tabel yang sesuai
    let profileId = undefined;
    let profileName = undefined;

    if (user.role === 'patient') {
      // Query tabel Pasien berdasarkan user_id
      const [patients] = await db.query<any[]>(
        'SELECT ID_pasien, Nama FROM Pasien WHERE user_id = ?',
        [user.id]
      );
      if (patients.length > 0) {
        profileId = patients[0].ID_pasien;
        profileName = patients[0].Nama;
      }
    } else if (user.role === 'doctor') {
      // Query tabel Karyawan untuk dokter berdasarkan user_id
      const [karyawan] = await db.query<any[]>(
        'SELECT k.ID_karyawan, k.Nama FROM Karyawan k JOIN Dokter d ON k.ID_karyawan = d.ID_karyawan WHERE k.user_id = ?',
        [user.id]
      );
      if (karyawan.length > 0) {
        profileId = karyawan[0].ID_karyawan;
        profileName = karyawan[0].Nama;
      }
    } else {
      // staff_registration, staff_pharmacy, staff_lab, staff_cashier
      // Query tabel Karyawan, Operasional, atau Resepsionis
      const [karyawan] = await db.query<any[]>(
        'SELECT ID_karyawan, Nama FROM Karyawan WHERE user_id = ?',
        [user.id]
      );
      if (karyawan.length > 0) {
        profileId = karyawan[0].ID_karyawan;
        profileName = karyawan[0].Nama;
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      profileId,
      profileName
    };

    return sessionUser;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Fungsi untuk set session cookie
export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify(user);
  cookieStore.set('session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 hari
  });
}

// Fungsi untuk get current user dari session
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    const user = JSON.parse(sessionCookie.value) as SessionUser;
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Fungsi untuk logout
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Fungsi untuk hash password (untuk registrasi)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Fungsi untuk verify auth dari request
export async function verifyAuth(request: NextRequest): Promise<VerifyAuthResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { isValid: false };
    }

    return { isValid: true, user };
  } catch (error) {
    console.error('Verify auth error:', error);
    return { isValid: false };
  }
}
