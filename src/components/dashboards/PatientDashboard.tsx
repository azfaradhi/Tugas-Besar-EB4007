'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface PatientDashboardProps {
  user: SessionUser;
}

export default function PatientDashboard({ user }: PatientDashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch appointments
      const apptRes = await fetch(`/api/appointments?patientId=${user.profileId}`);
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments || []);
      }

      // Fetch wearable data
      const wearableRes = await fetch(`/api/wearable?patientId=${user.profileId}`);
      if (wearableRes.ok) {
        const wearableDataRes = await wearableRes.json();
        setWearableData(wearableDataRes.data || []);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Pasien</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Janji Temu</h3>
          <p className="text-3xl font-bold text-indigo-600">{appointments.length}</p>
          <p className="text-sm text-gray-500">Total janji temu</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Data Kesehatan</h3>
          <p className="text-3xl font-bold text-green-600">{wearableData.length}</p>
          <p className="text-sm text-gray-500">Data monitoring</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Status</h3>
          <p className="text-lg font-bold text-blue-600">Aktif</p>
          <p className="text-sm text-gray-500">Status akun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Janji Temu Terbaru</h3>
          {appointments.length === 0 ? (
            <p className="text-gray-500">Belum ada janji temu</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt: any) => (
                <div key={apt.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <p className="font-semibold">{apt.doctor_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(apt.appointment_date).toLocaleDateString('id-ID')} - {apt.appointment_time}
                  </p>
                  <p className="text-xs text-gray-500">Status: {apt.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monitoring Kesehatan</h3>
          {wearableData.length === 0 ? (
            <p className="text-gray-500">Belum ada data monitoring</p>
          ) : (
            <div className="space-y-3">
              {wearableData.slice(0, 5).map((data: any) => (
                <div key={data.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="font-semibold">{data.measurement_type}</p>
                  <p className="text-sm text-gray-600">
                    {data.value} {data.unit}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(data.measured_at).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
