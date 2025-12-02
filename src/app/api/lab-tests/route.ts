import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [labTests] = await db.query(`
      SELECT
        lt.*,
        p.name as patient_name
      FROM lab_tests lt
      JOIN patients p ON lt.patient_id = p.id
      ORDER BY lt.requested_at DESC
    `);

    return NextResponse.json({ labTests });
  } catch (error) {
    console.error('Get lab tests error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
