// app/doctor/patients/page.tsx
import { redirect } from 'next/navigation';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import PatientListClient from '@/components/doctor/PatientListClient';

export interface PatientListItem {
  id: number;                 // ID_Pasien
  name: string;
  lastMeetingDate: string;    // ISO string
  lastComplaint: string | null;
  totalAppointments: number;
}

export interface PatientDetail {
  id: number;
  name: string;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  // plus fields lain kalau mau
}

export interface PatientAppointment {
  id: number;                 // ID_pertemuan
  date: string;               // ISO
  startTime: string;
  endTime: string | null;
  complaint: string | null;
  status: string | null;
}

export interface MedicalRecord {
  id: number;
  date: string;
  diagnosis: string | null;
  notes: string | null;
}


interface RawRow extends RowDataPacket {
  ID_Pasien: number;
  Nama: string;
  Tanggal: string;       // datetime from DB
  Waktu_mulai: string;
  Keluhan: string | null;
}

async function getPatientsForDoctor(doctorId: number) {
  // SESUAIKAN nama tabel & kolom
  const [rows] = await db.query<RawRow[]>(
    `
    SELECT 
      p.ID_Pasien,
      p.Nama,
      a.Tanggal
    FROM pertemuan a
    JOIN pasien p ON p.ID_Pasien = a.ID_Pasien
    WHERE a.ID_Dokter = ?
    ORDER BY a.Tanggal DESC, a.Waktu_mulai DESC
    `,
    [doctorId]
  );

  // Group by patient, ambil pertemuan terbaru
  const map = new Map<number, {
    id: number;
    name: string;
    lastMeetingDate: string;
    lastComplaint: string | null;
    totalAppointments: number;
  }>();

  for (const row of rows) {
    if (!map.has(row.ID_Pasien)) {
      map.set(row.ID_Pasien, {
        id: row.ID_Pasien,
        name: row.Nama,
        lastMeetingDate: row.Tanggal,
        lastComplaint: row.Keluhan,
        totalAppointments: 1,
      });
    } else {
      const cur = map.get(row.ID_Pasien)!;
      cur.totalAppointments += 1;
    }
  }

  return Array.from(map.values());
}

export default async function PatientsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'doctor' || !user.profileId) {
    redirect('/login'); // atau halaman lain
  }

  const patients = await getPatientsForDoctor(user.profileId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Daftar Pasien</h1>
            <p className="text-slate-500">
              Pasien yang pernah berkonsultasi dengan dr. {user.profileName}
            </p>
          </div>
        </div>

        <PatientListClient initialPatients={patients} />
      </div>
    </div>
  );
}
