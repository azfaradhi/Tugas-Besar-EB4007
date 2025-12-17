import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('_id');
    const identifier = searchParams.get('identifier');
    const name = searchParams.get('name');

    let sql = 'SELECT * FROM Pasien WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND ID_pasien = ?';
      params.push(id);
    }

    if (identifier) {
      sql += ' AND ID_pasien = ?';
      params.push(identifier);
    }

    if (name) {
      sql += ' AND Nama LIKE ?';
      params.push(`%${name}%`);
    }

    const pasiens: any = await query(sql, params);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: pasiens.length,
      entry: pasiens.map((p: any) => ({
        fullUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fhir/Patient/${p.ID_pasien}`,
        resource: mapPasienToFHIR(p)
      }))
    };

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error fetching FHIR Patient:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Failed to fetch Patient resource'
        }]
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const fhirPatient = await request.json();

    if (fhirPatient.resourceType !== 'Patient') {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type must be Patient'
          }]
        },
        { status: 400 }
      );
    }

    const pasienData = mapFHIRToPasien(fhirPatient);

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Pasien'
    );
    const count = countResult[0].count;
    const ID_pasien = `P${String(count + 1).padStart(3, '0')}`;

    const birthDate = new Date(pasienData.Tanggal_lahir);
    const today = new Date();
    let Umur = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      Umur--;
    }

    await query(
      `INSERT INTO Pasien
       (ID_pasien, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_pasien,
        pasienData.Nama,
        pasienData.Tanggal_lahir,
        Umur,
        pasienData.Jenis_kelamin,
        pasienData.No_telpon || null,
        pasienData.Alamat || null,
        pasienData.Golongan_darah || null
      ]
    );

    const created: any = await query(
      'SELECT * FROM Pasien WHERE ID_pasien = ?',
      [ID_pasien]
    );

    return NextResponse.json(mapPasienToFHIR(created[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating FHIR Patient:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Failed to create Patient resource'
        }]
      },
      { status: 500 }
    );
  }
}

function mapPasienToFHIR(pasien: any) {
  return {
    resourceType: 'Patient',
    id: pasien.ID_pasien,
    identifier: [
      {
        system: 'urn:oid:2.16.840.1.113883.2.4.6.3',
        value: pasien.ID_pasien
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: pasien.Nama
      }
    ],
    telecom: pasien.No_telpon ? [
      {
        system: 'phone',
        value: pasien.No_telpon
      }
    ] : [],
    gender: pasien.Jenis_kelamin === 'Laki-laki' ? 'male' : 'female',
    birthDate: pasien.Tanggal_lahir,
    address: pasien.Alamat ? [
      {
        use: 'home',
        text: pasien.Alamat
      }
    ] : [],
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodType',
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0189',
              code: pasien.Golongan_darah || 'UNK',
              display: pasien.Golongan_darah || 'Unknown'
            }
          ]
        }
      }
    ]
  };
}

function mapFHIRToPasien(fhirPatient: any) {
  const name = fhirPatient.name?.[0]?.text || '';
  const telecom = fhirPatient.telecom?.find((t: any) => t.system === 'phone');
  const address = fhirPatient.address?.[0]?.text || '';
  const bloodType = fhirPatient.extension?.find((e: any) =>
    e.url === 'http://hl7.org/fhir/StructureDefinition/patient-bloodType'
  );

  return {
    Nama: name,
    Tanggal_lahir: fhirPatient.birthDate,
    Jenis_kelamin: fhirPatient.gender === 'male' ? 'Laki-laki' : 'Perempuan',
    No_telpon: telecom?.value || '',
    Alamat: address,
    Golongan_darah: bloodType?.valueCodeableConcept?.coding?.[0]?.code || ''
  };
}
