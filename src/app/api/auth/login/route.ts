import { NextRequest, NextResponse } from 'next/server';
import { login, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, recaptchaToken } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA (optional for development)
    if (recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      });

      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        return NextResponse.json(
          { error: 'Verifikasi CAPTCHA gagal. Mohon coba lagi.' },
          { status: 400 }
        );
      }
    }

    const user = await login(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Set session cookie
    await setSessionCookie(user);

    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profileId: user.profileId,
        profileName: user.profileName
      }
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
