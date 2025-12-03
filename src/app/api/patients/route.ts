import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('id');
    
    let query = 'SELECT * FROM patients';

    const conditions: string[] = [];
    const params: any[] = []; 

    if (patientId) {
      conditions.push('id = ?');
      params.push(patientId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [patients] = await db.query(query, params);

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
