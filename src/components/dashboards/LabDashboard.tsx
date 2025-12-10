'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface LabDashboardProps {
  user: SessionUser;
}

interface HasilPemeriksaan {
  ID_hasil: string;
  ID_pertemuan: string;
  tanggal_pertemuan: string;
  nama_pasien: string;
  nama_dokter: string;
  ronsen: Array<{
    ID_ronsen: string;
    imgSrc: string;
  }>;
  urin_test: {
    ID_uji: string;
    Warna?: string;
    Kejernihan?: string;
    pH?: string;
    Berat_jenis?: string;
    Protein?: string;
    Glukosa?: string;
    Keton?: string;
    Bilirubin?: string;
    Darah?: string;
    Leukosit?: string;
    Nitrit?: string;
  } | null;
}

export default function LabDashboard({ user }: LabDashboardProps) {
  const [hasilPemeriksaan, setHasilPemeriksaan] = useState<HasilPemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHasil, setSelectedHasil] = useState<HasilPemeriksaan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/hasil-pemeriksaan');
      if (res.ok) {
        const data = await res.json();
        setHasilPemeriksaan(data.hasil_pemeriksaan || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (hasil: HasilPemeriksaan) => {
    setSelectedHasil(hasil);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasilWithRonsen = hasilPemeriksaan.filter(h => h.ronsen && h.ronsen.length > 0);
  const hasilWithUrinTest = hasilPemeriksaan.filter(h => h.urin_test);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Laboratorium</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Pemeriksaan</p>
                <p className="text-3xl font-bold text-gray-900">{hasilPemeriksaan.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Hasil Ronsen</p>
                <p className="text-3xl font-bold text-gray-900">{hasilWithRonsen.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tes Urin</p>
                <p className="text-3xl font-bold text-gray-900">{hasilWithUrinTest.length}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hasil Ronsen</h2>
            </div>

            {hasilWithRonsen.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Belum ada hasil ronsen</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {hasilWithRonsen.map((hasil) => (
                  <div key={hasil.ID_hasil} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{hasil.nama_pasien}</p>
                      <p className="text-sm text-gray-600">Dokter: {hasil.nama_dokter}</p>
                      <p className="text-xs text-gray-500">{hasil.tanggal_pertemuan}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {hasil.ronsen.slice(0, 2).map((ronsen) => (
                        <img
                          key={ronsen.ID_ronsen}
                          src={ronsen.imgSrc}
                          alt="Ronsen"
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => handleViewDetail(hasil)}
                        />
                      ))}
                    </div>
                    {hasil.ronsen.length > 2 && (
                      <p className="text-sm text-gray-600 mt-2">+{hasil.ronsen.length - 2} gambar lainnya</p>
                    )}
                    <button
                      onClick={() => handleViewDetail(hasil)}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Lihat Detail
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hasil Tes Urin</h2>
            </div>

            {hasilWithUrinTest.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-gray-500">Belum ada hasil tes urin</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {hasilWithUrinTest.map((hasil) => (
                  <div key={hasil.ID_hasil} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{hasil.nama_pasien}</p>
                      <p className="text-sm text-gray-600">Dokter: {hasil.nama_dokter}</p>
                      <p className="text-xs text-gray-500">{hasil.tanggal_pertemuan}</p>
                    </div>
                    {hasil.urin_test && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {hasil.urin_test.Warna && (
                            <div>
                              <span className="text-gray-600">Warna:</span>
                              <span className="ml-2 font-medium text-gray-900">{hasil.urin_test.Warna}</span>
                            </div>
                          )}
                          {hasil.urin_test.pH && (
                            <div>
                              <span className="text-gray-600">pH:</span>
                              <span className="ml-2 font-medium text-gray-900">{hasil.urin_test.pH}</span>
                            </div>
                          )}
                          {hasil.urin_test.Protein && (
                            <div>
                              <span className="text-gray-600">Protein:</span>
                              <span className="ml-2 font-medium text-gray-900">{hasil.urin_test.Protein}</span>
                            </div>
                          )}
                          {hasil.urin_test.Glukosa && (
                            <div>
                              <span className="text-gray-600">Glukosa:</span>
                              <span className="ml-2 font-medium text-gray-900">{hasil.urin_test.Glukosa}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleViewDetail(hasil)}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Lihat Detail
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetailModal && selectedHasil && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Detail Hasil Pemeriksaan</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 text-lg">{selectedHasil.nama_pasien}</p>
              <p className="text-sm text-gray-600">Dokter: {selectedHasil.nama_dokter}</p>
              <p className="text-xs text-gray-500">{selectedHasil.tanggal_pertemuan}</p>
            </div>

            {selectedHasil.ronsen && selectedHasil.ronsen.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Hasil Ronsen</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedHasil.ronsen.map((ronsen) => (
                    <img
                      key={ronsen.ID_ronsen}
                      src={ronsen.imgSrc}
                      alt="Ronsen"
                      className="w-full rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedHasil.urin_test && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Hasil Tes Urin</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedHasil.urin_test).map(([key, value]) => {
                    if (key === 'ID_uji' || !value) return null;
                    return (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{key.replace(/_/g, ' ')}</p>
                        <p className="font-medium text-gray-900">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
