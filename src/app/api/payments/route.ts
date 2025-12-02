import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [payments] = await db.query(`
      SELECT
        pay.*,
        p.name as patient_name
      FROM payments pay
      JOIN patients p ON pay.patient_id = p.id
      ORDER BY pay.created_at DESC
    `);

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
