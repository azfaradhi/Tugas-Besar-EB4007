// app/doctor/patients/[patientId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';
    
interface PatientRow extends RowDataPacket {
  ID_Pasien: number;
  Nama: string;
  Tanggal_lahir: string | null;
  Jenis_kelamin: string | null;
  No_telpon: string | null;
  Alamat: string | null;
}

interface AppointmentRow extends RowDataPacket {
  ID_pertemuan: number;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  Keluhan: string | null;
  Status: string | null;
}

interface MedicalRecordRow extends RowDataPacket {
  ID_rekam: number;
  Tanggal: string;
  Diagnosa: string | null;
  Catatan: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function calcAge(dateStr: string | null) {
  if (!dateStr) return '-';
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} th`;
}

export default async function PatientDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params;
  const patientId = Number(id);

  const user = await getCurrentUser();

  if (!user || user.role !== 'doctor' || !user.profileId) {
    redirect('/login');
  }

  if (Number.isNaN(patientId)) notFound();

  const [patientRows] = await db.query<PatientRow[]>(
    `
    SELECT 
      ID_pasien as ID_Pasien,
      Nama as Nama,
      Tanggal_lahir as Tanggal_lahir,
      Jenis_kelamin as Jenis_kelamin,
      No_telpon as No_telpon,
      Alamat as Alamat
    FROM Pasien
    WHERE ID_pasien = ?
    `,
    [patientId]
  );

  if (patientRows.length === 0) notFound();
  const patient = patientRows[0];

  const [appointmentRows] = await db.query<AppointmentRow[]>(
    `
    SELECT
      ID_pertemuan as ID_pertemuan,
      Tanggal as Tanggal,
      Waktu_mulai as Waktu_mulai,
      Waktu_selesai as Waktu_selesai
    FROM Pertemuan
    WHERE ID_Pasien = ? AND ID_Dokter = ?
    ORDER BY Tanggal DESC, Waktu_mulai DESC
    `,
    [patientId, user.profileId]
  );

  let medicalRows: MedicalRecordRow[] = [];
  try {
    const [rows] = await db.query<MedicalRecordRow[]>(
      `
      SELECT 
        hp.ID_hasil as ID_rekam,
        p.Tanggal as Tanggal,
        '' as Diagnosa,
        '' as Catatan
      FROM Hasil_Pemeriksaan hp
      JOIN Pertemuan p ON hp.ID_pertemuan = p.ID_pertemuan
      WHERE p.ID_Pasien = ? AND p.ID_Dokter = ?
      ORDER BY p.Tanggal DESC
      `,
      [patientId, user.profileId]
    );
    medicalRows = rows;
  } catch (e) {
    medicalRows = [];
  }

  const upcoming = appointmentRows.filter(
    (a) => new Date(a.Tanggal) >= new Date()
  );
  const past = appointmentRows.filter(
    (a) => new Date(a.Tanggal) < new Date()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-500 mb-2">
          <span className="text-slate-400">Patients</span>
          <span className="mx-1">›</span>
          <span className="font-medium text-slate-700">{patient.Nama}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1.3fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Patient Card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xl">
                  {patient.Nama.split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {patient.Nama}
                  </h1>
                  <p className="text-sm text-slate-500">Pasien</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Tanggal Lahir
                  </p>
                  <p className="font-medium">{formatDate(patient.Tanggal_lahir)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Usia</p>
                  <p className="font-medium">{calcAge(patient.Tanggal_lahir)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Jenis Kelamin
                  </p>
                  <p className="font-medium">
                    {patient.Jenis_kelamin === 'L'
                      ? 'Laki-laki'
                      : patient.Jenis_kelamin === 'P'
                      ? 'Perempuan'
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    No. Telepon
                  </p>
                  <p className="font-medium">
                    {patient.No_telpon || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs uppercase text-slate-400">Alamat</p>
                  <p className="font-medium">
                    {patient.Alamat || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Riwayat Pertemuan
                </h2>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    {upcoming.length} upcoming
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                    {past.length} past
                  </span>
                </div>
              </div>

              {appointmentRows.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Belum ada pertemuan dengan pasien ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {appointmentRows.map((apt) => (
                    <div
                      key={apt.ID_pertemuan}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(apt.Tanggal)} • {apt.Waktu_mulai.slice(0,5)}
                          {apt.Waktu_selesai
                            ? `–${apt.Waktu_selesai.slice(0,5)}`
                            : ''}
                        </p>
                        {apt.Keluhan && (
                          <p className="text-xs text-slate-500">
                            Keluhan: {apt.Keluhan}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.Status && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            {apt.Status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Medical records */}
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Rekam Medis
                </h2>
                <span className="text-xs text-slate-400">
                  {medicalRows.length} record
                </span>
              </div>

              {medicalRows.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Belum ada rekam medis yang tercatat.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {medicalRows.map((rec) => (
                    <div
                      key={rec.ID_rekam}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                    >
                      <p className="text-xs text-slate-500">
                        {formatDate(rec.Tanggal)}
                      </p>
                      {rec.Diagnosa && (
                        <p className="font-semibold text-slate-900">
                          Diagnosa: {rec.Diagnosa}
                        </p>
                      )}
                      {rec.Catatan && (
                        <p className="mt-1 text-xs text-slate-500">
                          Catatan: {rec.Catatan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
