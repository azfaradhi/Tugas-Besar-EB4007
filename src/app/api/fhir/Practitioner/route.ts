import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');
    const identifier = searchParams.get('identifier');
    const name = searchParams.get('name');

    let sql = `
      SELECT d.*, k.Nama, k.No_telpon, k.Jenis_kelamin, k.Tanggal_lahir
      FROM Dokter d
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND d.ID_karyawan = ?';
      params.push(id);
    }

    if (identifier) {
      sql += ' AND d.STR = ?';
      params.push(identifier);
    }

    if (name) {
      sql += ' AND k.Nama LIKE ?';
      params.push(`%${name}%`);
    }

    const dokters: any = await query(sql, params);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: dokters.length,
      entry: dokters.map((d: any) => ({
        fullUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fhir/Practitioner/${d.ID_karyawan}`,
        resource: mapDokterToFHIR(d)
      }))
    };

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error fetching FHIR Practitioner:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Failed to fetch Practitioner resource'
        }]
      },
      { status: 500 }
    );
  }
}

function mapDokterToFHIR(dokter: any) {
  return {
    resourceType: 'Practitioner',
    id: dokter.ID_karyawan,
    identifier: [
      {
        system: 'http://terminology.kemkes.go.id/CodeSystem/practitioner-license-number',
        value: dokter.STR
      }
    ],
    active: dokter.Status === 'Aktif',
    name: [
      {
        use: 'official',
        text: dokter.Nama
      }
    ],
    telecom: dokter.No_telpon ? [
      {
        system: 'phone',
        value: dokter.No_telpon
      }
    ] : [],
    gender: dokter.Jenis_kelamin === 'Laki-laki' ? 'male' : 'female',
    birthDate: dokter.Tanggal_lahir,
    qualification: [
      {
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
              code: 'MD',
              display: 'Doctor of Medicine'
            }
          ],
          text: dokter.Spesialis
        }
      }
    ]
  };
}
