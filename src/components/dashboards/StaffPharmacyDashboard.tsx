'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface StaffPharmacyDashboardProps {
  user: SessionUser;
}

export default function StaffPharmacyDashboard({ user }: StaffPharmacyDashboardProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prescRes, medRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/medications'),
      ]);

      if (prescRes.ok) {
        const data = await prescRes.json();
        setPrescriptions(data.prescriptions || []);
      }
      if (medRes.ok) {
        const data = await medRes.json();
        setMedications(data.medications || []);
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

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'pending');

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Farmasi</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Resep Menunggu</h3>
          <p className="text-3xl font-bold text-orange-600">{pendingPrescriptions.length}</p>
          <p className="text-sm text-gray-500">Perlu diproses</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Resep</h3>
          <p className="text-3xl font-bold text-indigo-600">{prescriptions.length}</p>
          <p className="text-sm text-gray-500">Semua resep</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Stok Obat</h3>
          <p className="text-3xl font-bold text-green-600">{medications.length}</p>
          <p className="text-sm text-gray-500">Jenis obat</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Resep Menunggu Proses</h3>
        {pendingPrescriptions.length === 0 ? (
          <p className="text-gray-500">Tidak ada resep yang menunggu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Resep
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
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingPrescriptions.map((presc: any) => (
                  <tr key={presc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {presc.prescription_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {presc.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {presc.doctor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(presc.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-indigo-600 hover:text-indigo-900">Proses</button>
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
