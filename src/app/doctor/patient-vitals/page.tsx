'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WearableData } from '@/types';

interface PatientWithVitals {
  ID_pasien: string;
  Nama: string;
  latest_heart_rate?: string;
  latest_spo2?: string;
  hr_status?: string;
  spo2_status?: string;
  latest_measurement_time?: string;
  is_live?: boolean; // To indicate real-time data
}

export default function PatientVitalsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientWithVitals[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [measurements, setMeasurements] = useState<WearableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'doctor') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch initial patients data
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/patients');
        if (!res.ok) throw new Error('Failed to fetch patients');
        const patientsData = await res.json();
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Gagal memuat data pasien');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [user, userLoading]);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => console.log('Doctor dashboard connected to WebSocket');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.patientId && (data.heart_rate || data.spo2)) {
          setPatients(prevPatients => 
            prevPatients.map(p => {
              if (p.ID_pasien === data.patientId) {
                return {
                  ...p,
                  latest_heart_rate: data.heart_rate?.toString() || p.latest_heart_rate,
                  latest_spo2: data.spo2?.toString() || p.latest_spo2,
                  latest_measurement_time: new Date().toISOString(),
                  is_live: true
                };
              }
              return p;
            })
          );
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => {
      ws.close();
    };
  }, []);

  // Fetch measurements for selected patient
  useEffect(() => {
    if (!selectedPatient) return;
    const fetchMeasurements = async () => {
      try {
        setLoadingMeasurements(true);
        const res = await fetch(`/api/wearable?patientId=${selectedPatient}`);
        if (res.ok) {
          const result = await res.json();
          setMeasurements(result.data || []);
        } else {
          setError('Gagal memuat data pengukuran');
        }
      } catch (error) {
        console.error('Error fetching measurements:', error);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoadingMeasurements(false);
      }
    };
    fetchMeasurements();
  }, [selectedPatient]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'normal': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'critical': return 'Kritis';
      case 'warning': return 'Peringatan';
      case 'normal': return 'Normal';
      default: return '-';
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{userLoading ? 'Memuat data user...' : 'Memuat data pasien...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Monitor Vital Signs Pasien</h1>
          <p className="text-gray-600 mt-1">Lihat hasil pengukuran Heart Rate & SpO2 dari MAX30102</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Daftar Pasien</h2></div>
          {patients.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500">Belum ada data pasien</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasien</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heart Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SpO2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Terakhir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.ID_pasien} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {patient.is_live && <span className="mr-2 h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient.Nama}</div>
                            <div className="text-sm text-gray-500">{patient.ID_pasien}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.latest_heart_rate ? (
                          <span className="text-sm font-medium text-gray-900">{patient.latest_heart_rate} bpm</span>
                        ) : (<span className="text-sm text-gray-400">-</span>)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.latest_spo2 ? (
                          <span className="text-sm font-medium text-gray-900">{patient.latest_spo2}%</span>
                        ) : (<span className="text-sm text-gray-400">-</span>)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.latest_measurement_time ? new Date(patient.latest_measurement_time).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => setSelectedPatient(patient.ID_pasien)} className="text-blue-600 hover:text-blue-900 font-medium">
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Riwayat Pengukuran - {patients.find(p => p.ID_pasien === selectedPatient)?.Nama}</h2>
              <button onClick={() => setSelectedPatient('')} className="text-gray-500 hover:text-gray-700">✕ Tutup</button>
            </div>
            {loadingMeasurements ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Memuat data...</p></div>
            ) : measurements.length === 0 ? (
              <div className="text-center py-12"><p className="text-gray-500">Belum ada data pengukuran untuk pasien ini</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {measurements.map((measurement, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(measurement.measured_at).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{measurement.measurement_type === 'heart_rate' ? 'Heart Rate' : 'SpO2'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{measurement.value} {measurement.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(measurement.status)}`}>{getStatusLabel(measurement.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
