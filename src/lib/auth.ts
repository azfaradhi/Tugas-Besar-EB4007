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

    // Ambil data profile berdasarkan role
    let profileId = undefined;
    let profileName = undefined;

    if (user.role === 'patient') {
      const [patients] = await db.query<any[]>(
        'SELECT id, name FROM patients WHERE user_id = ?',
        [user.id]
      );
      if (patients.length > 0) {
        profileId = patients[0].id;
        profileName = patients[0].name;
      }
    } else if (user.role === 'doctor') {
      const [doctors] = await db.query<any[]>(
        'SELECT id, name FROM doctors WHERE user_id = ?',
        [user.id]
      );
      if (doctors.length > 0) {
        profileId = doctors[0].id;
        profileName = doctors[0].name;
      }
    } else {
      const [staff] = await db.query<any[]>(
        'SELECT id, name FROM staff WHERE user_id = ?',
        [user.id]
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
