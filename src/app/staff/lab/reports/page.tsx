'use client';

import { useEffect, useState } from 'react';

interface LabTest {
  ID_hasil: string;
  Tanggal: string;
  test_type: 'urin' | 'ronsen' | null;
  nama_pasien: string;
  nama_dokter: string;
  urin_data?: any;
  ronsen_data?: any;
}

export default function LabReportsPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

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

  const getFilteredTests = () => {
    const now = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    return labTests.filter((test) => {
      const testDate = new Date(test.Tanggal);
      return testDate >= cutoffDate;
    });
  };

  const filteredTests = getFilteredTests();
  const completedTests = filteredTests.filter(hasResults);
  const pendingTests = filteredTests.filter((t) => !hasResults(t));
  const urinTests = filteredTests.filter((t) => t.test_type === 'urin');
  const ronsenTests = filteredTests.filter((t) => t.test_type === 'ronsen');

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'week':
        return '7 Hari Terakhir';
      case 'month':
        return '30 Hari Terakhir';
      case 'year':
        return '1 Tahun Terakhir';
      default:
        return '';
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID Hasil', 'Tanggal', 'Pasien', 'Dokter', 'Jenis Tes', 'Status'].join(','),
      ...filteredTests.map((test) =>
        [
          test.ID_hasil,
          new Date(test.Tanggal).toLocaleDateString('id-ID'),
          test.nama_pasien,
          test.nama_dokter,
          test.test_type === 'urin' ? 'Tes Urin' : 'Rontgen',
          hasResults(test) ? 'Selesai' : 'Menunggu',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-lab-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Laboratorium</h1>
          <p className="text-gray-600">Statistik dan laporan aktivitas laboratorium</p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg font-medium ${
              dateRange === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg font-medium ${
              dateRange === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-4 py-2 rounded-lg font-medium ${
              dateRange === 'year'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            1 Tahun
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{getDateRangeLabel()}</h2>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Tes</h3>
          <p className="text-4xl font-bold text-indigo-600">{filteredTests.length}</p>
          <p className="text-sm text-gray-500 mt-1">Permintaan tes</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selesai</h3>
          <p className="text-4xl font-bold text-green-600">{completedTests.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {filteredTests.length > 0
              ? Math.round((completedTests.length / filteredTests.length) * 100)
              : 0}
            % dari total
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Menunggu</h3>
          <p className="text-4xl font-bold text-orange-600">{pendingTests.length}</p>
          <p className="text-sm text-gray-500 mt-1">Belum selesai</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rata-rata Harian</h3>
          <p className="text-4xl font-bold text-purple-600">
            {dateRange === 'week'
              ? Math.round(filteredTests.length / 7)
              : dateRange === 'month'
              ? Math.round(filteredTests.length / 30)
              : Math.round(filteredTests.length / 365)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Tes per hari</p>
        </div>
      </div>

      {/* Test Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Jenis Tes</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Tes Urin</span>
                <span className="font-semibold text-purple-600">{urinTests.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-purple-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredTests.length > 0
                        ? (urinTests.length / filteredTests.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTests.length > 0
                  ? Math.round((urinTests.length / filteredTests.length) * 100)
                  : 0}
                % dari total
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Rontgen</span>
                <span className="font-semibold text-blue-600">{ronsenTests.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredTests.length > 0
                        ? (ronsenTests.length / filteredTests.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTests.length > 0
                  ? Math.round((ronsenTests.length / filteredTests.length) * 100)
                  : 0}
                % dari total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Completion</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Selesai</span>
                <span className="font-semibold text-green-600">{completedTests.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredTests.length > 0
                        ? (completedTests.length / filteredTests.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTests.length > 0
                  ? Math.round((completedTests.length / filteredTests.length) * 100)
                  : 0}
                % dari total
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Menunggu</span>
                <span className="font-semibold text-orange-600">{pendingTests.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-orange-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredTests.length > 0
                        ? (pendingTests.length / filteredTests.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTests.length > 0
                  ? Math.round((pendingTests.length / filteredTests.length) * 100)
                  : 0}
                % dari total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Detail</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Statistik Tes Urin</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Tes:</span>
                  <span className="font-medium">{urinTests.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Selesai:</span>
                  <span className="font-medium text-green-600">
                    {urinTests.filter(hasResults).length}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Menunggu:</span>
                  <span className="font-medium text-orange-600">
                    {urinTests.filter((t) => !hasResults(t)).length}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Statistik Rontgen</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Tes:</span>
                  <span className="font-medium">{ronsenTests.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Selesai:</span>
                  <span className="font-medium text-green-600">
                    {ronsenTests.filter(hasResults).length}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Menunggu:</span>
                  <span className="font-medium text-orange-600">
                    {ronsenTests.filter((t) => !hasResults(t)).length}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
