'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface CashierDashboardProps {
  user: SessionUser;
}

interface Billing {
  ID_billing: string;
  ID_pasien: string;
  Lunas_date: string | null;
  Jenis_pembayaran: string;
  isLunas: number;
  nama_pasien: string;
  NIK: string;
  No_telpon: string;
}

export default function CashierDashboard({ user }: CashierDashboardProps) {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'lunas' | 'belum'>('all');
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/billing');
      if (res.ok) {
        const data = await res.json();
        setBillings(data.billings || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedBilling) return;

    try {
      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_billing: selectedBilling.ID_billing,
          isLunas: true,
        }),
      });

      if (res.ok) {
        alert('Pembayaran berhasil dikonfirmasi');
        setShowPaymentModal(false);
        setSelectedBilling(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal mengkonfirmasi pembayaran');
      }
    } catch (error) {
      console.error('Error updating billing:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleOpenPaymentModal = (billing: Billing) => {
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredBillings = billings.filter(billing => {
    if (filterStatus === 'lunas') return billing.isLunas === 1;
    if (filterStatus === 'belum') return billing.isLunas === 0;
    return true;
  });

  const totalLunas = billings.filter(b => b.isLunas === 1).length;
  const totalBelum = billings.filter(b => b.isLunas === 0).length;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Kasir</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tagihan</p>
                <p className="text-3xl font-bold text-gray-900">{billings.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sudah Lunas</p>
                <p className="text-3xl font-bold text-gray-900">{totalLunas}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Belum Lunas</p>
                <p className="text-3xl font-bold text-gray-900">{totalBelum}</p>
              </div>
              <div className="bg-red-100 rounded-full p-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Daftar Tagihan</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStatus('belum')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'belum'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Belum Lunas
              </button>
              <button
                onClick={() => setFilterStatus('lunas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'lunas'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lunas
              </button>
            </div>
          </div>

          {filteredBillings.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Tidak ada tagihan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID Tagihan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pasien</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">NIK</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Metode Pembayaran</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal Lunas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillings.map((billing) => (
                    <tr key={billing.ID_billing} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{billing.ID_billing}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{billing.nama_pasien}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{billing.NIK}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {billing.Jenis_pembayaran}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {billing.isLunas === 1 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Lunas
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {billing.Lunas_date
                          ? new Date(billing.Lunas_date).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {billing.isLunas === 0 && (
                          <button
                            onClick={() => handleOpenPaymentModal(billing)}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Konfirmasi Bayar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Pembayaran</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Tagihan:</span>
                <span className="font-medium text-gray-900">{selectedBilling.ID_billing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pasien:</span>
                <span className="font-medium text-gray-900">{selectedBilling.nama_pasien}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">NIK:</span>
                <span className="font-medium text-gray-900">{selectedBilling.NIK}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran:</span>
                <span className="font-medium text-gray-900">{selectedBilling.Jenis_pembayaran}</span>
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
                  setSelectedBilling(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleMarkAsPaid}
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
