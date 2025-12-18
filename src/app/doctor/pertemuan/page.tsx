'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Appointment {
  ID_jadwal: string;
  ID_pasien: string;
  Tanggal: string;
  Date: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  patient_name: string;
}

export default function PertemuanPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'past' |'today' | 'upcoming' | 'all'>('today');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/jadwal-praktik');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.jadwals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Extract date from Tanggal field (ISO format)
  const getDateString = (tanggal: string) => {
    const date = new Date(tanggal);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const pastAppointments = appointments.filter(a => getDateString(a.Tanggal) < todayStr);
  const todayAppointments = appointments.filter(a => getDateString(a.Tanggal) === todayStr);
  const upcomingAppointments = appointments.filter(a => getDateString(a.Tanggal) > todayStr);

  const displayed =
    activeTab === 'today'
      ? todayAppointments
      : activeTab === 'upcoming'
      ? upcomingAppointments
      : activeTab === 'past'
      ? pastAppointments
      : appointments;

  if (loading) {
    return <div className="p-8 text-center text-slate-900">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Daftar Pertemuan</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {[
            { key: 'past', label: `Yang Lalu (${pastAppointments.length})` },
            { key: 'today', label: `Hari Ini (${todayAppointments.length})` },
            { key: 'upcoming', label: `Akan Datang (${upcomingAppointments.length})` },
            { key: 'all', label: `Semua (${appointments.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <p className="text-slate-500 text-center py-10">Tidak ada pertemuan</p>
        ) : (
          <div className="space-y-4">
            {displayed.map(apt => {
              const displayDate = new Date(apt.Tanggal);

              return (
                <div
                  key={apt.ID_jadwal}
                  className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">
                      #{apt.ID_jadwal}
                    </span>

                    {apt.status === 'completed' && (
                      <span className="text-green-600 text-sm font-semibold">Selesai</span>
                    )}
                    {apt.status === 'scheduled' && (
                      <span className="text-blue-600 text-sm font-semibold">Terjadwal</span>
                    )}
                    {apt.status === 'cancelled' && (
                      <span className="text-red-600 text-sm font-semibold">Dibatalkan</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {apt.patient_name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                    <span>
                      {displayDate.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span>{apt.Waktu_mulai}</span>
                  </div>

                  {apt.status === 'completed' && (
                    <Link
                      href={`/doctor/examination/${apt.ID_pertemuan}?mode=view`}
                      className="inline-block mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
                    >
                      Lihat Hasil Pemeriksaan
                    </Link>
                  )}

                  {apt.status === 'scheduled' && (
                    <Link
                      href={`/doctor/examination/${apt.ID_pertemuan}`}
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Periksa Pasien
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
