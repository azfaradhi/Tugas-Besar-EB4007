import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [patients] = await db.query(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
