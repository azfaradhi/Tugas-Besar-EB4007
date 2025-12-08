import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';
import { User } from '@/types';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  profileId?: number;
  profileName?: string;
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

    console.log('DEBUUUGGGG User found during login:', user);
    // Ambil data profile berdasarkan role
    let profileId = undefined;
    let profileName = undefined;

    if (user.role === 'patient') {
      const [patients] = await db.query<any[]>(
        'SELECT ID_pasien, Nama FROM Pasien WHERE ID_pasien = ?',
        [user.profile_id]
      );
      if (patients.length > 0) {
        profileId = patients[0].ID_pasien;
        profileName = patients[0].Nama ;
      }
    } else if (user.role === 'doctor') {
      console.log('Looking for doctor with user.profile_id:', user.profile_id);
      const [doctors] = await db.query<any[]>(
        'SELECT dokter.ID_karyawan, karyawan.Nama FROM dokter JOIN karyawan ON dokter.ID_karyawan = karyawan.ID_karyawan WHERE dokter.ID_karyawan = ?',
        [user.profile_id]
      );
      console.log('Doctors found:', doctors);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Tambahkan delay untuk debugging
      if (doctors.length > 0) {
        profileId = doctors[0].ID_karyawan;
        profileName = doctors[0].Nama;
      }
    } else {
      const [staff] = await db.query<any[]>(
        'SELECT id, name FROM staff WHERE user_id = ?',
        [user.profile_id]
      );
      if (staff.length > 0) {
        profileId = staff[0].id;
        profileName = staff[0].name;
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
