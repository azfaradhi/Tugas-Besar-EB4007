'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Medication {
  ID_obat: string;
  nama_obat: string;
  kategori: string;
  dosis?: string | null;
  frekuensi?: string | null;
  durasi_hari?: number | null;
  catatan?: string | null;
}

interface Prescription {
  ID_hasil: string;
  tanggal: string;      // dari Pertemuan.Tanggal
  waktu_mulai: string;  // dari Pertemuan.Waktu_mulai
  dokter: string;       // nama dokter
  diagnosis: string | null;
  status: 'active' | 'history';
  medications: Medication[];
}

interface Billing {
  ID_billing: string;
  ID_pasien: string;
  Lunas_date: string | null;
  Jenis_pembayaran: string;
  isLunas: number;
  nama_pasien: string;
}

export default function PatientPharmacyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        setLoading(false);
        return;
      }

      const userData = await userRes.json();
      setUser(userData.user);

      const patientId = userData.user.profileId;

      const [pharmacyRes, billingRes] = await Promise.all([
        fetch(`/api/pharmacy?patientId=${patientId}`),
        fetch(`/api/billing?patientId=${patientId}`)
      ]);

      if (pharmacyRes.ok) {
        const data = await pharmacyRes.json();
        setPrescriptions(data.prescriptions || []);
      }

      if (billingRes.ok) {
        const data = await billingRes.json();
        setBillings(data.billings || []);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const historyPrescriptions = prescriptions.filter(p => p.status !== 'active');

  const allMedications = prescriptions.flatMap(p => p.medications);
  const uniqueMedicationIds = new Set(allMedications.map(m => m.ID_obat));
  const unpaidBillings = billings.filter(b => b.isLunas === 0);
  const paidBillings = billings.filter(b => b.isLunas === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmasi</h1>
        <p className="text-gray-600">
          Informasi obat yang diresepkan dan status pembayaran Anda
        </p>
      </div>

      {/* Ringkasan Farmasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Resep</p>
          <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-600 mb-1">Resep Aktif</p>
          <p className="text-3xl font-bold text-gray-900">{activePrescriptions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <p className="text-sm font-medium text-gray-600 mb-1">Jenis Obat Berbeda</p>
          <p className="text-3xl font-bold text-gray-900">{uniqueMedicationIds.size}</p>
        </div>
      </div>

      {/* Resep Aktif */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resep Aktif</h2>

        {activePrescriptions.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">Tidak ada resep aktif saat ini.</p>
          </div>
        )}

        <div className="space-y-4">
          {activePrescriptions.map((prescription) => (
            <div
              key={prescription.ID_hasil}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      Resep Aktif
                    </span>
                    <span className="text-sm font-semibold text-gray-500">
                      ID Hasil: {prescription.ID_hasil}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    Dokter: <span className="font-semibold">{prescription.dokter}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tanggal: {new Date(prescription.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}{' '}
                    • Jam: {prescription.waktu_mulai?.slice(0, 5)}
                  </p>
                  {prescription.diagnosis && (
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold">Diagnosis:</span> {prescription.diagnosis}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabel Obat */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-gray-700">Obat</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Kategori</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Dosis</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Frekuensi</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Durasi (hari)</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Aturan Pakai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medications.map((med) => (
                      <tr key={med.ID_obat} className="border-t">
                        <td className="px-4 py-2 font-medium text-gray-900">{med.nama_obat}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">
                            {med.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-2">{med.dosis || '-'}</td>
                        <td className="px-4 py-2">{med.frekuensi || '-'}</td>
                        <td className="px-4 py-2">
                          {med.durasi_hari != null ? `${med.durasi_hari} hari` : '-'}
                        </td>
                        <td className="px-4 py-2">{med.catatan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Ikuti aturan minum obat yang tertera. Jika ada efek samping, segera konsultasikan
                dengan dokter atau petugas kesehatan.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Resep */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Resep</h2>

        {historyPrescriptions.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">Belum ada riwayat resep.</p>
          </div>
        )}

        <div className="space-y-4">
          {historyPrescriptions.map((prescription) => (
            <div
              key={prescription.ID_hasil}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-400"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      Riwayat
                    </span>
                    <span className="text-sm font-semibold text-gray-500">
                      ID Hasil: {prescription.ID_hasil}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    Dokter: <span className="font-semibold">{prescription.dokter}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tanggal: {new Date(prescription.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}{' '}
                    • Jam: {prescription.waktu_mulai?.slice(0, 5)}
                  </p>
                  {prescription.diagnosis && (
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold">Diagnosis:</span> {prescription.diagnosis}
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-gray-700">Obat</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Kategori</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Dosis</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Frekuensi</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Durasi (hari)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medications.map((med) => (
                      <tr key={med.ID_obat} className="border-t">
                        <td className="px-4 py-2 font-medium text-gray-900">{med.nama_obat}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">
                            {med.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-2">{med.dosis || '-'}</td>
                        <td className="px-4 py-2">{med.frekuensi || '-'}</td>
                        <td className="px-4 py-2">
                          {med.durasi_hari != null ? `${med.durasi_hari} hari` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pembayaran - mirip halaman pembayaran */}      
      <div className="border-t pt-8 mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Informasi Pembayaran</h2>
          <p className="text-gray-600 text-sm">
            Ringkasan tagihan Anda terkait layanan kesehatan (termasuk obat, pemeriksaan, dan lainnya).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Tagihan</p>
            <p className="text-3xl font-bold text-gray-900">{billings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-600 mb-1">Sudah Lunas</p>
            <p className="text-3xl font-bold text-gray-900">{paidBillings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm font-medium text-gray-600 mb-1">Belum Lunas</p>
            <p className="text-3xl font-bold text-gray-900">{unpaidBillings.length}</p>
          </div>
        </div>

        {unpaidBillings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tagihan Belum Lunas</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-red-800">
                  Anda memiliki {unpaidBillings.length} tagihan yang belum dibayar. Silakan lakukan pembayaran di kasir.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {unpaidBillings.map((billing) => (
                <div
                  key={billing.ID_billing}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          {billing.ID_billing}
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          Belum Lunas
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        Metode Pembayaran:{' '}
                        <span className="font-bold">{billing.Jenis_pembayaran || 'Belum ditentukan'}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Silakan lakukan pembayaran di farmasi dengan membawa nomor tagihan ini.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paidBillings.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Riwayat Pembayaran Lunas</h3>
            <div className="grid gap-4">
              {paidBillings.map((billing) => (
                <div
                  key={billing.ID_billing}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          {billing.ID_billing}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Lunas
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        Metode Pembayaran:{' '}
                        <span className="font-bold">{billing.Jenis_pembayaran || '-'}</span>
                      </p>
                      {billing.Lunas_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Dibayar pada{' '}
                            {new Date(billing.Lunas_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {billings.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Tagihan</h3>
            <p className="text-gray-600 text-sm">
              Anda belum memiliki riwayat tagihan atau pembayaran.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
