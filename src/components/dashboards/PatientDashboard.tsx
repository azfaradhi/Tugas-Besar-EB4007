'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/auth';

interface PatientDashboardProps {
  user: SessionUser;
}

export default function PatientDashboard({ user }: PatientDashboardProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const appointmentRes = await fetch(`/api/pertemuan?patientId=${user.profileId}`);
      if (appointmentRes.ok) {
        const data = await appointmentRes.json();
        setAppointments(data.pertemuans || []);
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const upcomingAppointments = appointments.filter(
    (apt) => {
      const aptDateStr = apt.Tanggal; // Sudah YYYY-MM-DD dari DATE_FORMAT
      return aptDateStr >= todayStr;
    }
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Pasien</h1>
          <p className="text-gray-600">Selamat datang kembali, {user.username}</p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => router.push('/patient/visit-registration')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transform hover:scale-105 transition duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Daftar Kunjungan Baru
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Kunjungan</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Jadwal Mendatang</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* IoT Health Monitor Card */}
          <div
            onClick={() => router.push('/patient/health-monitor')}
            className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Health Monitor</p>
                <p className="text-lg font-semibold text-red-600">IoT MAX30102</p>
                <p className="text-xs text-gray-500 mt-1">Klik untuk lihat</p>
              </div>
              <div className="bg-red-100 rounded-full p-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Jadwal Kunjungan</h2>
              <span className="text-sm text-gray-500">{appointments.length} total</span>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-4">Belum ada jadwal kunjungan</p>
                <button
                  onClick={() => router.push('/patient/visit-registration')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Daftar sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 5).map((apt: any, index: number) => {
                  // Ambil string tanggal langsung dari database (YYYY-MM-DD)
                  const aptDateStr = apt.Tanggal; // Sudah format YYYY-MM-DD dari DATE_FORMAT
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const isPast = aptDateStr < todayStr;
                  const status = isPast ? 'completed' : 'scheduled';
                  
                  // Parse untuk display saja (gunakan local timezone)
                  const [year, month, day] = aptDateStr.split('-').map(Number);
                  const displayDate = new Date(year, month - 1, day);
                  
                  return (
                    <div key={apt.ID_pertemuan || index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">{apt.doctor_name || 'Dokter'}</p>
                          <div className="flex items-center text-sm text-gray-600 gap-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {displayDate.toLocaleDateString('id-ID', {
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
                        {getStatusBadge(status)}
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
