'use client';

import { useEffect, useState } from 'react';

interface LabTest {
  ID_hasil: string;
  ID_pertemuan: string;
  diagnosis: string;
  hasil_status: string;
  ID_Pasien: string;
  Tanggal: string;
  Waktu_mulai: string;
  nama_pasien: string;
  nama_dokter: string;
  Spesialis: string;
  test_type: 'urin' | 'ronsen' | null;
  ID_uji?: string;
  ID_ronsen?: string;
  urin_data?: any;
  ronsen_data?: any;
}

export default function LabHistoryPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urin' | 'ronsen'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await fetch('/api/lab-tests');
      if (response.ok) {
        const data = await response.json();
        setLabTests(data.labTests || []);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = (test: LabTest) => {
    if (test.test_type === 'urin' && test.urin_data) {
      return Object.keys(test.urin_data).some(
        (key) => key !== 'ID_uji' && key !== 'ID_hasil' && test.urin_data[key] !== null
      );
    }
    if (test.test_type === 'ronsen' && test.ronsen_data) {
      return test.ronsen_data.imgSrc !== null;
    }
    return false;
  };

  const filterByDate = (test: LabTest) => {
    if (dateFilter === 'all') return true;

    const testDate = new Date(test.Tanggal);
    const now = new Date();

    switch (dateFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return testDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return testDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredTests = labTests.filter((test) => {
    const matchesFilter = filter === 'all' || test.test_type === filter;
    const matchesDate = filterByDate(test);
    const matchesSearch =
      !searchTerm ||
      test.nama_pasien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.ID_hasil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.ID_Pasien.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesDate && matchesSearch && hasResults(test);
  });

  if (loading) {
    return (
      <div className="p-8">
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Riwayat Tes Laboratorium</h1>
        <p className="text-gray-600">Histori pemeriksaan laboratorium yang telah selesai</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Tes Selesai</h3>
          <p className="text-3xl font-bold text-green-600">{filteredTests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tes Urin</h3>
          <p className="text-3xl font-bold text-purple-600">
            {filteredTests.filter((t) => t.test_type === 'urin').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rontgen</h3>
          <p className="text-3xl font-bold text-blue-600">
            {filteredTests.filter((t) => t.test_type === 'ronsen').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Minggu Ini</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {labTests.filter((t) => {
              const testDate = new Date(t.Tanggal);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return testDate >= weekAgo && hasResults(t);
            }).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari pasien atau ID hasil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              30 Hari
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('urin')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'urin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Urin
            </button>
            <button
              onClick={() => setFilter('ronsen')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'ronsen'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rontgen
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Hasil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Tes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnosis
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada riwayat tes
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test.ID_hasil} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {test.ID_hasil}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(test.Tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{test.nama_pasien}</p>
                        <p className="text-gray-500 text-xs">{test.ID_Pasien}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.nama_dokter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {test.test_type === 'urin' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Tes Urin
                        </span>
                      ) : test.test_type === 'ronsen' ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Rontgen
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {test.diagnosis || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Detail Hasil Tes</h2>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {selectedTest.test_type === 'urin' ? 'Tes Urin' : 'Rontgen'}
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

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pasien</p>
                  <p className="font-medium text-gray-900">{selectedTest.nama_pasien}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dokter</p>
                  <p className="font-medium text-gray-900">{selectedTest.nama_dokter}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTest.Tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-medium text-gray-900">{selectedTest.diagnosis || '-'}</p>
                </div>
              </div>
            </div>

            {selectedTest.test_type === 'urin' && selectedTest.urin_data && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Hasil Tes Urin</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(selectedTest.urin_data)
                    .filter(([key]) => key !== 'ID_uji' && key !== 'ID_hasil')
                    .map(([key, value]) => (
                      value && (
                        <div key={key} className="border-b pb-2">
                          <p className="text-gray-600">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium text-gray-900">{String(value)}</p>
                        </div>
                      )
                    ))}
                </div>
              </div>
            )}

            {selectedTest.test_type === 'ronsen' && selectedTest.ronsen_data && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Hasil Rontgen</h3>
                {selectedTest.ronsen_data.imgSrc && (
                  <img
                    src={selectedTest.ronsen_data.imgSrc}
                    alt="Rontgen"
                    className="w-full border border-gray-300 rounded-lg"
                  />
                )}
              </div>
            )}

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
