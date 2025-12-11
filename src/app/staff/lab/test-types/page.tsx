'use client';

import { useState } from 'react';

export default function TestTypesPage() {
  const testTypes = [
    {
      id: 'urin',
      name: 'Tes Urin (Urinalisis)',
      description: 'Pemeriksaan komprehensif sampel urin untuk mendeteksi berbagai kondisi kesehatan',
      parameters: [
        'Warna', 'pH', 'Protein', 'Glukosa', 'Ketone', 'Bilirubin',
        'Urobilin', 'Hemoglobin', 'Sel Darah Putih', 'Sel Darah Merah',
        'Bakteri', 'Sel Epitel', 'Kristal', 'Casts'
      ],
      category: 'Kimia Klinik',
      duration: '30-60 menit',
    },
    {
      id: 'ronsen',
      name: 'Rontgen (X-Ray)',
      description: 'Pemeriksaan radiologi menggunakan sinar-X untuk melihat struktur internal tubuh',
      parameters: ['Gambar Radiologi'],
      category: 'Radiologi',
      duration: '15-30 menit',
    },
  ];

  const [selectedTest, setSelectedTest] = useState<typeof testTypes[0] | null>(null);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Jenis Tes Laboratorium</h1>
        <p className="text-gray-600">Informasi mengenai jenis-jenis tes yang tersedia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testTypes.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTest(test)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{test.name}</h3>
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                    {test.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Durasi</p>
                  <p className="font-semibold text-gray-900">{test.duration}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{test.description}</p>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Parameter yang Diperiksa:</p>
                <div className="flex flex-wrap gap-2">
                  {test.parameters.slice(0, 5).map((param, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {param}
                    </span>
                  ))}
                  {test.parameters.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{test.parameters.length - 5} lainnya
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTest(test);
                }}
                className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Lihat Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedTest.name}</h2>
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {selectedTest.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Deskripsi</h3>
                <p className="text-gray-600">{selectedTest.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Waktu Pemeriksaan</h3>
                <p className="text-gray-600">{selectedTest.duration}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Parameter yang Diperiksa</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedTest.parameters.map((param, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">{param}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTest.id === 'urin' && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Informasi Tambahan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Sampel urin diperlukan (mid-stream urine)</li>
                    <li>Sebaiknya menggunakan sampel urin pagi hari pertama</li>
                    <li>Hindari makanan/minuman yang dapat mempengaruhi warna urin</li>
                    <li>Hasil dapat mendeteksi infeksi saluran kemih, diabetes, penyakit ginjal, dll</li>
                  </ul>
                </div>
              )}

              {selectedTest.id === 'ronsen' && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Informasi Tambahan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Pemeriksaan non-invasif menggunakan sinar-X</li>
                    <li>Pasien diminta melepas aksesori logam</li>
                    <li>Dapat digunakan untuk memeriksa tulang, paru-paru, jantung, dll</li>
                    <li>Hasil berupa gambar radiologi yang diinterpretasi oleh dokter</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedTest(null)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
