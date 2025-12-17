'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type LabKind = 'urin' | 'ronsen' | null;

interface LabTest {
  ID_hasil: string;
  ID_pertemuan: string;
  diagnosis: string | null;
  hasil_status?: string | null; // optional kalau backend masih kirim
  status?: string | null;       // optional kalau backend ganti field
  ID_Pasien: string;

  Tanggal: string;
  Waktu_mulai: string;

  nama_pasien: string;
  nama_dokter: string;
  Spesialis: string | null;

  // backend lama
  test_type?: 'urin' | 'ronsen' | null;

  // backend baru (sesuai instruksi kamu): ambil dari Hasil_Pemeriksaan.treatment_plan
  treatment_plan?: string | null;

  // optional hasil detail (kalau backend join)
  urin_data?: any;
  ronsen_data?: any;
}

function normalizeLabType(test: Partial<LabTest>): LabKind {
  const raw = (test.test_type ?? test.treatment_plan ?? '')
    .toString()
    .toLowerCase()
    .trim();

  if (raw === 'urin') return 'urin';
  if (raw === 'ronsen' || raw === 'rontgen') return 'ronsen';
  return null;
}

function hasResults(test: LabTest & { test_type: LabKind }) {
  if (test.test_type === 'urin' && test.urin_data) {
    return Object.keys(test.urin_data).some(
      (k) => k !== 'ID_uji' && k !== 'ID_hasil' && test.urin_data[k] !== null && test.urin_data[k] !== ''
    );
  }
  if (test.test_type === 'ronsen' && test.ronsen_data) {
    return !!test.ronsen_data.imgSrc;
  }

  const s = (test.hasil_status ?? test.status ?? '').toString().toLowerCase();
  if (s === 'completed') return true;

  return false;
}


export default function LabRequestsPage() {
  const router = useRouter();

  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'all' | 'urin' | 'ronsen'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await fetch('/api/lab-tests', { cache: 'no-store' });
      if (!response.ok) throw new Error('Gagal fetch /api/lab-tests');

      const data = await response.json();
      setLabTests((data.labTests || []) as LabTest[]);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setLabTests([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizedTests = useMemo(() => {
    return labTests.map((t) => ({
      ...t,
      test_type: normalizeLabType(t), 
    }));
  }, [labTests]);

  const filteredTests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return normalizedTests.filter((test) => {
      const matchesFilter = filter === 'all' || test.test_type === filter;

      const matchesSearch =
        !q ||
        (test.nama_pasien ?? '').toLowerCase().includes(q) ||
        (test.ID_hasil ?? '').toLowerCase().includes(q) ||
        (test.ID_Pasien ?? '').toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [normalizedTests, filter, searchTerm]);

  const pendingTests = useMemo(() => filteredTests.filter((t) => !hasResults(t as any)), [filteredTests]);
  const completedTests = useMemo(() => filteredTests.filter((t) => hasResults(t as any)), [filteredTests]);

  const handleProcessTest = (test: LabTest & { test_type: LabKind }) => {
    const type = test.test_type;
    if (!type) {
      alert('Jenis tes tidak valid. Pastikan treatment_plan berisi "urin" atau "ronsen".');
      return;
    }

    const done = hasResults(test as any); // completed kalau sudah ada hasil
    const view = done ? '&view=1' : '';   

    router.push(`/staff/lab/results?type=${type}&id=${test.ID_hasil}${view}`);
  };


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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Permintaan Lab</h1>
        <p className="text-gray-600">Kelola permintaan tes laboratorium dari dokter</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Permintaan</h3>
          <p className="text-3xl font-bold text-indigo-600">{filteredTests.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Menunggu Hasil</h3>
          <p className="text-3xl font-bold text-orange-600">{pendingTests.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selesai</h3>
          <p className="text-3xl font-bold text-green-600">{completedTests.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tes Urin</h3>
          <p className="text-3xl font-bold text-purple-600">
            {normalizedTests.filter((t) => t.test_type === 'urin').length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari pasien / ID hasil / ID pasien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>

            <button
              onClick={() => setFilter('urin')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'urin' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tes Urin
            </button>

            <button
              onClick={() => setFilter('ronsen')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'ronsen' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rontgen
            </button>
          </div>
        </div>
      </div>

      {/* Lab Tests Table */}
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
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada permintaan lab
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => {
                  const done = hasResults(test as any);

                  return (
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

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{test.nama_dokter}</p>
                          <p className="text-gray-500 text-xs">{test.Spesialis || '-'}</p>
                        </div>
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
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            N/A
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {test.diagnosis || '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {done ? (
                          <span className="px-3 py-1 inline-block bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Selesai
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-block bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            Menunggu
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleProcessTest(test as any)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {done ? 'Lihat' : 'Proses'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
