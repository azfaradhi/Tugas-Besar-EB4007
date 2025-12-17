'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';
import Link from 'next/link';
import DoctorScheduleCalendar from '@/components/DoctorScheduleCalendar';

interface DoctorDashboardProps {
  user: SessionUser;
}

interface Appointment {
  ID_pertemuan: string;
  ID_Pasien: string;
  ID_Dokter: string;
  ID_Perawat: string | null;
  ID_ruangan: string | null;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  patient_name: string;
  doctor_specialization: string;
  doctor_name: string;
  has_hasil_pemeriksaan: string | null;
}

interface JadwalPraktik {
  ID_jadwal: string;
  ID_Dokter: string;
  ID_ruangan: string | null;
  Date: string;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  status: string;
  ruangan_lantai: number | null;
  gedung_nama: string | null;
  ID_gedung: string | null;
  patient_name: string | null;
  ID_pasien: string | null;
}

export default function DoctorDashboard({ user }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [jadwalPraktik, setJadwalPraktik] = useState<JadwalPraktik[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'upcoming'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch appointments
      const resAppointments = await fetch(`/api/pertemuan?doctorId=${user.profileId}`);
      if (resAppointments.ok) {
        const data = await resAppointments.json();
        setAppointments(data.pertemuans || []);
      }

      // Fetch jadwal praktik
      const resJadwal = await fetch(`/api/jadwal-praktik?doctorId=${user.profileId}`);
      if (resJadwal.ok) {
        const dataJadwal = await resJadwal.json();
        console.log('Jadwal praktik response:', dataJadwal);
        setJadwalPraktik(dataJadwal.jadwals || []);
      } else {
        console.error('Failed to fetch jadwal praktik:', await resJadwal.text());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Berlangsung', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Filter appointments yang belum diperiksa (untuk tab Today dan Upcoming)
  const pendingAppointments = appointments.filter((apt) => !apt.has_hasil_pemeriksaan);

  const todayAppointments = pendingAppointments.filter((apt) => {
    const aptDateStr = apt.Tanggal; // Sudah YYYY-MM-DD dari DATE_FORMAT
    return aptDateStr === todayStr;
  });

  const upcomingAppointments = pendingAppointments.filter((apt) => {
    const aptDateStr = apt.Tanggal; // Sudah YYYY-MM-DD dari DATE_FORMAT
    return aptDateStr > todayStr;
  });

  const scheduledCount = upcomingAppointments.length + todayAppointments.length;

  const getDisplayedAppointments = () => {
    switch (activeTab) {
      case 'today':
        return todayAppointments;
      case 'upcoming':
        return upcomingAppointments;
      case 'all':
        return appointments;
      default:
        return todayAppointments;
    }
  };

  const displayedAppointments = getDisplayedAppointments();

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Dokter</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pasien Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Pasien</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Akan Datang</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aktif</p>
                <p className="text-3xl font-bold text-gray-900">{scheduledCount}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal Praktik Calendar Section */}
        <DoctorScheduleCalendar appointments={jadwalPraktik} />

        {/* Appointments Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'today'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Hari Ini ({todayAppointments.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Akan Datang ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Semua ({appointments.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {displayedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">
                  {activeTab === 'today' && 'Tidak ada pasien hari ini'}
                  {activeTab === 'upcoming' && 'Tidak ada jadwal mendatang'}
                  {activeTab === 'all' && 'Belum ada appointment'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedAppointments.map((apt: any, index: number) => {
                  // Ambil string tanggal langsung dari database (YYYY-MM-DD)
                  const aptDateStr = apt.Tanggal; // Sudah format YYYY-MM-DD dari DATE_FORMAT
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  
                  // Tentukan status berdasarkan apakah sudah ada hasil pemeriksaan
                  const status = apt.has_hasil_pemeriksaan ? 'completed' : 'scheduled';
                  
                  // Parse untuk display saja (gunakan local timezone)
                  const [year, month, day] = aptDateStr.split('-').map(Number);
                  const displayDate = new Date(year, month - 1, day);
                  
                  return (
                    <div
                      key={apt.ID_pertemuan || index}
                      className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold text-gray-500">
                              #{apt.ID_pertemuan}
                            </span>
                            {getStatusBadge(status)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{apt.patient_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {displayDate.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {apt.Waktu_mulai}
                          </span>
                        </div>
                      </div>
                      {apt.has_hasil_pemeriksaan ? (
                        <div className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg text-center">
                          ✓ Pemeriksaan Selesai
                        </div>
                      ) : (
                        <Link
                          href={`/doctor/examination/${apt.ID_pertemuan}`}
                          className="block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 text-center"
                        >
                          Periksa Pasien
                        </Link>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
