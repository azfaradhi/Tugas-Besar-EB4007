'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';
import Link from 'next/link';

interface DoctorDashboardProps {
  user: SessionUser;
}

interface Appointment {
  id: number;
  appointment_number: string;
  patient_name: string;
  patient_number: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  complaint: string;
}

export default function DoctorDashboard({ user }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/appointments?doctorId=${user.profileId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.appointment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

    setFilteredAppointments(filtered);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Dokter</h2>

    
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 md:w-64 ">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pasien Hari Ini</h3>
          <p className="text-3xl font-bold text-indigo-600">{appointments.length}</p>
          <p className="text-sm text-gray-500">Janji temu</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 md:w-64">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Pasien</h3>
          <p className="text-3xl font-bold text-green-600">{appointments.length}</p>
          <p className="text-sm text-gray-500">Semua janji temu</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-8 w-full h-full">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Cari Pasien
              </label>
              <input
                type="text"
                placeholder="Cari nama, no. pendaftaran, atau no. pasien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="scheduled">Terjadwal</option>
                <option value="in_progress">Sedang Diperiksa</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>
      </div>



      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Daftar Pasien</h3>
        {appointments.length === 0 ? (
          <p className="text-gray-500">Tidak ada janji temu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Pendaftaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Pasien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((apt: any) => (
                  <tr key={apt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {apt.appointment_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apt.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(apt.appointment_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apt.appointment_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        href={`/doctor/examination/${apt.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Periksa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
