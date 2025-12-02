import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [prescriptions] = await db.query(`
      SELECT
        pr.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN doctors d ON pr.doctor_id = d.id
      ORDER BY pr.created_at DESC
    `);

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
