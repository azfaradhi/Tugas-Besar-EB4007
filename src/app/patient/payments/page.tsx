'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Billing {
  ID_billing: string;
  ID_pasien: string;
  Lunas_date: string | null;
  Jenis_pembayaran: string;
  isLunas: number;
  nama_pasien: string;
}

export default function PatientPaymentsPage() {
  const router = useRouter();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        const billingRes = await fetch(`/api/billing?patientId=${userData.user.profileId}`);
        if (billingRes.ok) {
          const data = await billingRes.json();
          setBillings(data.billings || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const unpaidBillings = billings.filter(b => b.isLunas === 0);
  const paidBillings = billings.filter(b => b.isLunas === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Pembayaran</h1>
          <p className="text-gray-600">Informasi tagihan dan pembayaran Anda</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tagihan Belum Lunas</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-800">
                  Anda memiliki {unpaidBillings.length} tagihan yang belum dibayar. Silakan lakukan pembayaran di kasir.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {unpaidBillings.map((billing) => (
                <div key={billing.ID_billing} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
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
                        Metode Pembayaran: <span className="font-bold">{billing.Jenis_pembayaran}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Silakan lakukan pembayaran di kasir dengan membawa nomor tagihan ini
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Pembayaran Lunas</h2>
            <div className="grid gap-4">
              {paidBillings.map((billing) => (
                <div key={billing.ID_billing} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
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
                        Metode Pembayaran: <span className="font-bold">{billing.Jenis_pembayaran}</span>
                      </p>
                      {billing.Lunas_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            Dibayar pada {new Date(billing.Lunas_date).toLocaleDateString('id-ID', {
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
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Tagihan</h3>
            <p className="text-gray-600">Anda belum memiliki riwayat pembayaran</p>
          </div>
        )}
      </div>
    </div>
  );
}
