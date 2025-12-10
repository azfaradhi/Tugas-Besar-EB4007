import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'verifikasiPeserta':
        return await verifikasiPeserta(data);
      case 'getDiagnosa':
        return await getDiagnosa(data);
      case 'getKesadaran':
        return await getKesadaran();
      case 'getPoli':
        return await getPoli();
      case 'getDokter':
        return await getDokter(data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in P-Care API:', error);
    return NextResponse.json(
      { error: 'Failed to process P-Care request' },
      { status: 500 }
    );
  }
}

async function verifikasiPeserta(data: any) {
  const { nomorKartu, tanggalPelayanan } = data;

  if (!nomorKartu || !tanggalPelayanan) {
    return NextResponse.json(
      { error: 'Nomor kartu dan tanggal pelayanan harus diisi' },
      { status: 400 }
    );
  }

  const pasiens: any = await query(
    'SELECT * FROM Pasien WHERE NIK = ? OR No_telpon = ?',
    [nomorKartu, nomorKartu]
  );

  if (!pasiens || pasiens.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'Peserta tidak ditemukan',
      response: {
        metaData: {
          code: '404',
          message: 'Peserta tidak ditemukan'
        }
      }
    });
  }

  const pasien = pasiens[0];

  return NextResponse.json({
    success: true,
    response: {
      metaData: {
        code: '200',
        message: 'OK'
      },
      response: {
        peserta: {
          noKartu: nomorKartu,
          nama: pasien.Nama,
          nik: pasien.NIK,
          tglLahir: pasien.Tanggal_lahir,
          jenisKelamin: pasien.Jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
          golDarah: pasien.Golongan_darah || '-',
          noTelepon: pasien.No_telpon || '-',
          alamat: pasien.Alamat || '-',
          aktif: true,
          statusPeserta: {
            kode: '11',
            keterangan: 'Aktif'
          }
        }
      }
    }
  });
}

async function getDiagnosa(data: any) {
  const { keyword } = data;

  const diagnosaList = [
    { code: 'A00', name: 'Cholera' },
    { code: 'A01', name: 'Typhoid and paratyphoid fevers' },
    { code: 'A02', name: 'Other salmonella infections' },
    { code: 'A09', name: 'Diarrhoea and gastroenteritis' },
    { code: 'J00', name: 'Acute nasopharyngitis (common cold)' },
    { code: 'J01', name: 'Acute sinusitis' },
    { code: 'J02', name: 'Acute pharyngitis' },
    { code: 'J03', name: 'Acute tonsillitis' },
    { code: 'J06', name: 'Acute upper respiratory infections' },
    { code: 'J18', name: 'Pneumonia' },
    { code: 'I10', name: 'Essential (primary) hypertension' },
    { code: 'E11', name: 'Type 2 diabetes mellitus' },
    { code: 'M79', name: 'Other soft tissue disorders' },
    { code: 'K30', name: 'Dyspepsia' }
  ];

  const filtered = keyword
    ? diagnosaList.filter(d =>
        d.code.toLowerCase().includes(keyword.toLowerCase()) ||
        d.name.toLowerCase().includes(keyword.toLowerCase())
      )
    : diagnosaList;

  return NextResponse.json({
    success: true,
    response: {
      metaData: {
        code: '200',
        message: 'OK'
      },
      response: {
        list: filtered.map(d => ({
          kode: d.code,
          nama: d.name
        }))
      }
    }
  });
}

async function getKesadaran() {
  const kesadaranList = [
    { kode: '01', nama: 'Composmentis' },
    { kode: '02', nama: 'Apatis' },
    { kode: '03', nama: 'Somnolen' },
    { kode: '04', nama: 'Sopor' },
    { kode: '05', nama: 'Koma' }
  ];

  return NextResponse.json({
    success: true,
    response: {
      metaData: {
        code: '200',
        message: 'OK'
      },
      response: {
        list: kesadaranList
      }
    }
  });
}

async function getPoli() {
  const poliList = [
    { kode: '001', nama: 'Poli Umum' },
    { kode: '002', nama: 'Poli Gigi' },
    { kode: '003', nama: 'Poli Anak' },
    { kode: '004', nama: 'Poli Kandungan' },
    { kode: '005', nama: 'Poli Bedah' },
    { kode: '006', nama: 'Poli Mata' },
    { kode: '007', nama: 'Poli THT' },
    { kode: '008', nama: 'Poli Kulit' },
    { kode: '009', nama: 'Poli Jantung' },
    { kode: '010', nama: 'Poli Paru' }
  ];

  return NextResponse.json({
    success: true,
    response: {
      metaData: {
        code: '200',
        message: 'OK'
      },
      response: {
        list: poliList
      }
    }
  });
}

async function getDokter(data: any) {
  const { kodePoli } = data;

  const dokters: any = await query(
    `SELECT d.*, k.Nama
     FROM Dokter d
     LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan`
  );

  const mapped = dokters.map((d: any) => ({
    kode: d.ID_karyawan,
    nama: d.Nama,
    spesialis: d.Spesialis
  }));

  return NextResponse.json({
    success: true,
    response: {
      metaData: {
        code: '200',
        message: 'OK'
      },
      response: {
        list: mapped
      }
    }
  });
}
