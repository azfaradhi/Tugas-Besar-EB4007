'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HasilPemeriksaan {
  ID_hasil: string;
  ID_pertemuan: string;
  tanggal_pertemuan: string;
  nama_pasien: string;
  nama_dokter: string;
  Spesialis: string;
  diagnosis: string;
  symptoms: string;
  vital_signs: string;
  treatment_plan: string;
  notes: string;
  obat: Array<{
    ID_obat: string;
    nama_obat: string;
    kategori: string;
    dosis?: string;
    frekuensi?: string;
    durasi_hari?: number;
    qty?: number;
    catatan?: string;
  }>;
  ronsen: Array<{
    ID_ronsen: string;
    imgSrc: string;
    keterangan?: string;
  }>;
  urin_test: {
    ID_uji: string;
    Warna?: string;
    Kejernihan?: string;
    pH?: string;
    Protein?: string;
    Glukosa?: string;
  } | null;
}

export default function PatientMedicalRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<HasilPemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<HasilPemeriksaan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        const hasilRes = await fetch(`/api/hasil-pemeriksaan?patientId=${userData.user.profileId}`);
        if (hasilRes.ok) {
          const data = await hasilRes.json();
          setRecords(data.hasil_pemeriksaan || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: HasilPemeriksaan) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rekam Medis</h1>
          <p className="text-gray-600">Riwayat hasil pemeriksaan Anda</p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Rekam Medis</h3>
            <p className="text-gray-600">Anda belum memiliki riwayat pemeriksaan</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div key={record.ID_hasil} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-500">
                        {record.ID_hasil}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Selesai
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Pemeriksaan oleh {record.nama_dokter}
                    </h3>
                    <p className="text-gray-600 mb-2">{record.Spesialis}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.tanggal_pertemuan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetail(record)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Lihat Detail
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Obat</p>
                    <p className="text-2xl font-bold text-blue-600">{record.obat?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Ronsen</p>
                    <p className="text-2xl font-bold text-green-600">{record.ronsen?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Tes Urin</p>
                    <p className="text-2xl font-bold text-purple-600">{record.urin_test ? '1' : '0'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Detail Rekam Medis</h3>
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
              <p className="font-semibold text-gray-900 text-lg">{selectedRecord.nama_dokter}</p>
              <p className="text-sm text-gray-600">{selectedRecord.Spesialis}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedRecord.tanggal_pertemuan).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {selectedRecord.diagnosis && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Diagnosis</h4>
                <p className="p-4 bg-red-50 rounded-lg text-gray-900 border-l-4 border-red-500">
                  {selectedRecord.diagnosis}
                </p>
              </div>
            )}

            {selectedRecord.symptoms && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Gejala / Keluhan</h4>
                <p className="p-4 bg-yellow-50 rounded-lg text-gray-900 border-l-4 border-yellow-500">
                  {selectedRecord.symptoms}
                </p>
              </div>
            )}

            {selectedRecord.vital_signs && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Tanda Vital</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    try {
                      const vitals = JSON.parse(selectedRecord.vital_signs);
                      return Object.entries(vitals).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">{key.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="font-semibold text-gray-900">{value}</p>
                        </div>
                      ));
                    } catch {
                      return <p className="text-gray-500 col-span-4">Data tidak tersedia</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {selectedRecord.treatment_plan && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Rencana Perawatan</h4>
                <p className="p-4 bg-green-50 rounded-lg text-gray-900 border-l-4 border-green-500">
                  {selectedRecord.treatment_plan}
                </p>
              </div>
            )}

            {selectedRecord.notes && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Catatan Tambahan</h4>
                <p className="p-4 bg-purple-50 rounded-lg text-gray-900 border-l-4 border-purple-500">
                  {selectedRecord.notes}
                </p>
              </div>
            )}

            {selectedRecord.obat && selectedRecord.obat.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Resep Obat</h4>
                <div className="space-y-3">
                  {selectedRecord.obat.map((obat, idx) => (
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
                      <div className="grid grid-cols-2 gap-2 mt-3">
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
                      {obat.catatan && (
                        <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                          <p className="text-xs text-gray-600 mb-1">Aturan Pakai</p>
                          <p className="text-sm text-gray-900">{obat.catatan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.ronsen && selectedRecord.ronsen.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Hasil Ronsen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRecord.ronsen.map((ronsen) => (
                    <div key={ronsen.ID_ronsen} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={ronsen.imgSrc}
                        alt="Ronsen"
                        className="w-full object-cover"
                      />
                      {ronsen.keterangan && (
                        <div className="p-3 bg-gray-50">
                          <p className="text-sm text-gray-900">{ronsen.keterangan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.urin_test && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Hasil Tes Urin</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedRecord.urin_test).map(([key, value]) => {
                    if (key === 'ID_uji' || !value) return null;
                    return (
                      <div key={key} className="p-3 bg-purple-50 rounded-lg">
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
