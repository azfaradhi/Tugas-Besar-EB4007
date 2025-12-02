import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [doctors] = await db.query(
      'SELECT * FROM doctors ORDER BY name ASC'
    );

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
