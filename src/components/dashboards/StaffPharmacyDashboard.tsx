'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface StaffPharmacyDashboardProps {
  user: SessionUser;
}

interface BillingFarmasi {
  ID_billing_farmasi: string;
  Total_harga: number;
  isLunas: number;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
}

interface Prescription {
  ID_hasil: string;
  nama_pasien: string;
  nama_dokter: string;
  tanggal_pertemuan: string;
  obat: Array<{
    ID_obat: string;
    nama_obat: string;
    kategori: string;
    dosis?: string;
    frekuensi?: string;
    durasi_hari?: number;
    qty?: number;
    harga_satuan?: number;
    subtotal?: number;
  }>;
  billing_farmasi?: BillingFarmasi | null;
}

export default function StaffPharmacyDashboard({ user }: StaffPharmacyDashboardProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Debit' | 'Credit'>('Cash');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hasilRes, medRes] = await Promise.all([
        fetch('/api/hasil-pemeriksaan'),
        fetch('/api/obat'),
      ]);

      if (hasilRes.ok) {
        const data = await hasilRes.json();
        // Filter only hasil pemeriksaan with medications and get billing info
        const withMeds = (data.hasil_pemeriksaan || []).filter((h: any) => h.obat && h.obat.length > 0);

        // Fetch billing_farmasi for each prescription
        const prescriptionsWithBilling = await Promise.all(
          withMeds.map(async (presc: any) => {
            try {
              const billingRes = await fetch(`/api/billing-pharmacy?patientId=${presc.ID_Pasien}`);
              if (billingRes.ok) {
                const billingData = await billingRes.json();
                // Find billing for this hasil
                const billing = (billingData.billings || []).find(
                  (b: any) => b.ID_hasil === presc.ID_hasil
                );
                return {
                  ...presc,
                  billing_farmasi: billing || null
                };
              }
            } catch (error) {
              console.error('Error fetching billing for prescription:', error);
            }
            return { ...presc, billing_farmasi: null };
          })
        );

        setPrescriptions(prescriptionsWithBilling);
      }
      if (medRes.ok) {
        const data = await medRes.json();
        setMedications(data.obats || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (presc: Prescription) => {
    setSelectedPrescription(presc);
    setShowDetailModal(true);
  };

  const handleOpenPayment = (presc: Prescription) => {
    setSelectedPrescription(presc);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPrescription?.billing_farmasi) return;

    try {
      const res = await fetch('/api/billing-pharmacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_billing_farmasi: selectedPrescription.billing_farmasi.ID_billing_farmasi,
          isLunas: 1,
          Jenis_pembayaran: paymentMethod
        }),
      });

      if (res.ok) {
        alert('Pembayaran berhasil dikonfirmasi');
        setShowPaymentModal(false);
        setSelectedPrescription(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal mengkonfirmasi pembayaran');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unpaidPrescriptions = prescriptions.filter(
    (p) => p.billing_farmasi && p.billing_farmasi.isLunas === 0
  );
  const paidPrescriptions = prescriptions.filter(
    (p) => p.billing_farmasi && p.billing_farmasi.isLunas === 1
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Farmasi</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Belum Dibayar</p>
                <p className="text-3xl font-bold text-gray-900">{unpaidPrescriptions.length}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Resep</p>
                <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sudah Dibayar</p>
                <p className="text-3xl font-bold text-gray-900">{paidPrescriptions.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Resep Belum Dibayar</h3>
          {unpaidPrescriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tidak ada resep yang menunggu pembayaran</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">ID Hasil</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nama Pasien</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dokter</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unpaidPrescriptions.map((presc) => (
                    <tr key={presc.ID_hasil} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {presc.ID_hasil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {presc.nama_pasien}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {presc.nama_dokter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(presc.tanggal_pertemuan).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        Rp {presc.billing_farmasi?.Total_harga?.toLocaleString('id-ID') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetail(presc)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenPayment(presc)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Konfirmasi Bayar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Riwayat Resep Lunas</h3>
          {paidPrescriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada resep yang lunas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">ID Hasil</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nama Pasien</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Metode</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paidPrescriptions.map((presc) => (
                    <tr key={presc.ID_hasil} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {presc.ID_hasil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {presc.nama_pasien}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(presc.tanggal_pertemuan).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        Rp {presc.billing_farmasi?.Total_harga?.toLocaleString('id-ID') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {presc.billing_farmasi?.Jenis_pembayaran || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetail(presc)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Detail Resep</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 text-lg">Pasien: {selectedPrescription.nama_pasien}</p>
              <p className="text-sm text-gray-600">Dokter: {selectedPrescription.nama_dokter}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedPrescription.tanggal_pertemuan).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Daftar Obat</h4>
              <div className="space-y-3">
                {selectedPrescription.obat.map((obat, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{obat.nama_obat}</p>
                        <p className="text-sm text-gray-600">{obat.kategori}</p>
                      </div>
                      {obat.qty && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                          {obat.qty} unit
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {obat.dosis && (
                        <div>
                          <p className="text-xs text-gray-600">Dosis</p>
                          <p className="text-sm font-medium text-gray-900">{obat.dosis}</p>
                        </div>
                      )}
                      {obat.frekuensi && (
                        <div>
                          <p className="text-xs text-gray-600">Frekuensi</p>
                          <p className="text-sm font-medium text-gray-900">{obat.frekuensi}</p>
                        </div>
                      )}
                      {obat.durasi_hari && (
                        <div>
                          <p className="text-xs text-gray-600">Durasi</p>
                          <p className="text-sm font-medium text-gray-900">{obat.durasi_hari} hari</p>
                        </div>
                      )}
                    </div>
                    {obat.harga_satuan && (
                      <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Harga Satuan</span>
                          <span className="text-sm font-semibold text-gray-900">
                            Rp {obat.harga_satuan.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {obat.subtotal && (
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-600">Subtotal</span>
                            <span className="text-sm font-bold text-gray-900">
                              Rp {obat.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.billing_farmasi && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Harga</span>
                  <span className="text-2xl font-bold text-green-600">
                    Rp {selectedPrescription.billing_farmasi.Total_harga?.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPrescription.billing_farmasi.isLunas === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedPrescription.billing_farmasi.isLunas === 1 ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Pembayaran</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Hasil:</span>
                <span className="font-medium text-gray-900">{selectedPrescription.ID_hasil}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pasien:</span>
                <span className="font-medium text-gray-900">{selectedPrescription.nama_pasien}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600 font-semibold">Total Harga:</span>
                <span className="font-bold text-gray-900 text-lg">
                  Rp {selectedPrescription.billing_farmasi?.Total_harga?.toLocaleString('id-ID') || 0}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Pastikan pembayaran telah diterima sebelum mengkonfirmasi.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPrescription(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
