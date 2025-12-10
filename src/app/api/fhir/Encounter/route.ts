import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');
    const patient = searchParams.get('patient');
    const practitioner = searchParams.get('practitioner');
    const date = searchParams.get('date');

    let sql = `
      SELECT
        p.*,
        pas.Nama as nama_pasien,
        pas.ID_pasien,
        k.Nama as nama_dokter,
        d.ID_karyawan as id_dokter,
        r.ID_ruangan
      FROM Pertemuan p
      LEFT JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      LEFT JOIN Dokter d ON p.ID_Dokter = d.ID_karyawan
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      LEFT JOIN Ruangan r ON p.ID_ruangan = r.ID_ruangan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND p.ID_pertemuan = ?';
      params.push(id);
    }

    if (patient) {
      sql += ' AND p.ID_Pasien = ?';
      params.push(patient);
    }

    if (practitioner) {
      sql += ' AND p.ID_Dokter = ?';
      params.push(practitioner);
    }

    if (date) {
      sql += ' AND p.Tanggal = ?';
      params.push(date);
    }

    const pertemuans: any = await query(sql, params);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: pertemuans.length,
      entry: pertemuans.map((p: any) => ({
        fullUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fhir/Encounter/${p.ID_pertemuan}`,
        resource: mapPertemuanToFHIR(p)
      }))
    };

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error fetching FHIR Encounter:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Failed to fetch Encounter resource'
        }]
      },
      { status: 500 }
    );
  }
}

function mapPertemuanToFHIR(pertemuan: any) {
  const status = pertemuan.Waktu_selesai ? 'finished' : 'in-progress';

  return {
    resourceType: 'Encounter',
    id: pertemuan.ID_pertemuan,
    status: status,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${pertemuan.ID_Pasien}`,
      display: pertemuan.nama_pasien
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                code: 'PPRF',
                display: 'primary performer'
              }
            ]
          }
        ],
        individual: {
          reference: `Practitioner/${pertemuan.id_dokter}`,
          display: pertemuan.nama_dokter
        }
      }
    ],
    period: {
      start: `${pertemuan.Tanggal}T${pertemuan.Waktu_mulai}`,
      end: pertemuan.Waktu_selesai ? `${pertemuan.Tanggal}T${pertemuan.Waktu_selesai}` : undefined
    },
    location: pertemuan.ID_ruangan ? [
      {
        location: {
          reference: `Location/${pertemuan.ID_ruangan}`
        }
      }
    ] : []
  };
}
