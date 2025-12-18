'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';
import Link from 'next/link';

interface StaffRegistrationDashboardProps {
  user: SessionUser;
}

export default function StaffRegistrationDashboard({ user }: StaffRegistrationDashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apptRes, patientsRes, doctorsRes] = await Promise.all([
        fetch('/api/pertemuan'),
        fetch('/api/pasien'),
        fetch('/api/doctors'),
      ]);

      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data.pertemuans || []);
      }
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data.pasiens || []);
      }
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setDoctors(data.doctors || []);
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

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Staf Pendaftaran</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Pendaftaran</h3>
          <p className="text-3xl font-bold text-indigo-600">{appointments.length}</p>
          <p className="text-sm text-gray-500">Janji temu</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Pasien</h3>
          <p className="text-3xl font-bold text-green-600">{patients.length}</p>
          <p className="text-sm text-gray-500">Pasien terdaftar</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Dokter Tersedia</h3>
          <p className="text-3xl font-bold text-blue-600">{doctors.length}</p>
          <p className="text-sm text-gray-500">Dokter aktif</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4">
          <Link
            href="/staff/registration/patients"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Kelola Pasien
          </Link>
          <Link
            href="/staff/registration/users"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Kelola Pengguna
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Pendaftaran Terbaru</h3>
        {appointments.length === 0 ? (
          <p className="text-gray-500">Belum ada pendaftaran</p>
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
                    Dokter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.slice(0, 10).map((apt: any) => (
                  <tr key={apt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {apt.appointment_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apt.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apt.doctor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(apt.appointment_date).toLocaleDateString('id-ID')}
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
