// components/doctor/PatientListClient.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

interface PatientListItem {
  id: number;
  name: string;
  lastMeetingDate: string;
  lastComplaint: string | null;
  totalAppointments: number;
}

interface Props {
  initialPatients: PatientListItem[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PatientListClient({ initialPatients }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return initialPatients;
    const s = search.toLowerCase();
    return initialPatients.filter((p) =>
      p.name.toLowerCase().includes(s)
    );
  }, [initialPatients, search]);

  return (
    <div className="space-y-6">
      {/* Search + Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Cari pasien berdasarkan nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 text-sm text-slate-500">
          <div className="bg-white rounded-xl shadow-sm px-4 py-2">
            <span className="font-semibold text-slate-900">
              {initialPatients.length}
            </span>{' '}
            pasien
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
          Tidak ada pasien ditemukan.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <Link
              href={`/doctor/patients/${patient.id}`}
              key={patient.id}
              className="group block rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar bulat sederhana */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {patient.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                      {patient.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Terakhir pertemuan: {formatDate(patient.lastMeetingDate)}
                    </p>
                    {patient.lastComplaint && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        Keluhan terakhir: {patient.lastComplaint}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-medium text-slate-900">
                      {patient.totalAppointments}x kunjungan
                    </p>
                    <p className="text-[11px]">Klik untuk lihat detail</p>
                  </div>
                  <span className="inline-flex h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-medium text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
                    Detail
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
