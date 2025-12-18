'use client';

import { useEffect, useState } from 'react';

type UrinData = {
  pH: number;
  Protein: string;
  Glukosa: string;
  Ketone: string;
};

type RonsenData = {
  imgSrc: string;
  keterangan: string;
};

type LabResult = {
  ID_hasil: string;
  diagnosis: string;
  treatment_plan: 'urin' | 'ronsen';
  hasil_status: 'draft' | 'completed';
  created_at: string;

  nama_dokter: string;
  Spesialis: string;

  urin_data?: UrinData | null;
  ronsen_data?: RonsenData | null;
};

export default function LabResultsPage() {
  const [data, setData] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urin' | 'ronsen'>('all');

  useEffect(() => {
    fetch('/api/lab-results')
      .then(res => res.json())
      .then(res => setData(res.labTests || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data.filter(item => {
    if (filter === 'all') return true;
    return item.treatment_plan === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Hasil Laboratorium
        </h1>
        <p className="text-gray-600">
          Riwayat hasil pemeriksaan laboratorium Anda
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'urin', 'ronsen'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all'
              ? 'Semua'
              : f === 'urin'
              ? 'Uji Urin'
              : 'Rontgen'}
          </button>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Belum ada hasil lab.
        </div>
      )}

      {/* Cards */}
      <div className="space-y-5">
        {filteredData.map(item => (
          <div
            key={item.ID_hasil}
            className="bg-white rounded-xl shadow-md p-6 border"
          >
            {/* Header card */}
            <div className="flex justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {item.nama_dokter} ({item.Spesialis})
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block">
                  {item.ID_hasil}
                </span>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    item.hasil_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {item.hasil_status === 'completed'
                    ? 'Selesai'
                    : 'Draft'}
                </span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mb-4">
              <p className="font-medium text-gray-800">Diagnosis</p>
              <p className="text-gray-700">{item.diagnosis}</p>
            </div>

            {/* Urin */}
            {item.urin_data && (
              <div className="mt-4">
                <p className="font-medium mb-2 text-gray-800">
                  Hasil Uji Urin
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>pH: <strong>{item.urin_data.pH}</strong></div>
                  <div>Protein: <strong>{item.urin_data.Protein}</strong></div>
                  <div>Glukosa: <strong>{item.urin_data.Glukosa}</strong></div>
                  <div>Ketone: <strong>{item.urin_data.Ketone}</strong></div>
                </div>
              </div>
            )}

            {/* Ronsen */}
            {item.ronsen_data && (
              <div className="mt-4">
                <p className="font-medium mb-2 text-gray-800">
                  Hasil Rontgen
                </p>
                <img
                  src={item.ronsen_data.imgSrc}
                  alt="Rontgen"
                  className="w-full max-w-md rounded border"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {item.ronsen_data.keterangan}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
