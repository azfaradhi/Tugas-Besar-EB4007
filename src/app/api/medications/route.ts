import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [medications] = await db.query(
      'SELECT * FROM medications ORDER BY name ASC'
    );

    return NextResponse.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
