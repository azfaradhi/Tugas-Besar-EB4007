'use client';

import { useState, useEffect } from 'react';

interface ReportData {
  patients: any[];
  visits: any[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({ patients: [], visits: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, visitsRes] = await Promise.all([
        fetch('/api/pasien'),
        fetch('/api/pertemuan'),
      ]);

      const patients = patientsRes.ok ? (await patientsRes.json()).pasiens || [] : [];
      const visits = visitsRes.ok ? (await visitsRes.json()).pertemuans || [] : [];

      setData({ patients, visits });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVisits = () => {
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

    return data.visits.filter((visit) => {
      const visitDate = new Date(visit.Tanggal);
      return visitDate >= cutoffDate;
    });
  };

  const filteredVisits = getFilteredVisits();
  const completedVisits = filteredVisits.filter((v) => v.status === 'completed');
  const scheduledVisits = filteredVisits.filter((v) => v.status === 'scheduled');
  const cancelledVisits = filteredVisits.filter((v) => v.status === 'cancelled');

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
      ['Tanggal', 'Pasien', 'Dokter', 'Status'].join(','),
      ...filteredVisits.map((visit) =>
        [
          new Date(visit.Tanggal).toLocaleDateString('id-ID'),
          visit.nama_pasien,
          visit.nama_dokter,
          visit.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kunjungan-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Pendaftaran</h1>
          <p className="text-gray-600">Statistik dan laporan aktivitas pendaftaran</p>
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

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Pasien</h3>
          <p className="text-4xl font-bold text-indigo-600">{data.patients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Terdaftar</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Kunjungan</h3>
          <p className="text-4xl font-bold text-blue-600">{filteredVisits.length}</p>
          <p className="text-sm text-gray-500 mt-1">Periode ini</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Kunjungan Selesai</h3>
          <p className="text-4xl font-bold text-green-600">{completedVisits.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {filteredVisits.length > 0
              ? Math.round((completedVisits.length / filteredVisits.length) * 100)
              : 0}
            % dari total
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rata-rata Harian</h3>
          <p className="text-4xl font-bold text-purple-600">
            {dateRange === 'week'
              ? Math.round(filteredVisits.length / 7)
              : dateRange === 'month'
              ? Math.round(filteredVisits.length / 30)
              : Math.round(filteredVisits.length / 365)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Kunjungan per hari</p>
        </div>
      </div>

      {/* Visit Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Kunjungan</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Terjadwal</span>
                <span className="font-semibold text-orange-600">{scheduledVisits.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-orange-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredVisits.length > 0
                        ? (scheduledVisits.length / filteredVisits.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Selesai</span>
                <span className="font-semibold text-green-600">{completedVisits.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredVisits.length > 0
                        ? (completedVisits.length / filteredVisits.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Dibatalkan</span>
                <span className="font-semibold text-red-600">{cancelledVisits.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-red-600 h-4 rounded-full"
                  style={{
                    width: `${
                      filteredVisits.length > 0
                        ? (cancelledVisits.length / filteredVisits.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Demografi Pasien</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Laki-laki</span>
                <span className="font-semibold text-blue-600">
                  {data.patients.filter((p) => p.Jenis_kelamin === 'Laki-laki').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{
                    width: `${
                      data.patients.length > 0
                        ? (data.patients.filter((p) => p.Jenis_kelamin === 'Laki-laki').length /
                            data.patients.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Perempuan</span>
                <span className="font-semibold text-pink-600">
                  {data.patients.filter((p) => p.Jenis_kelamin === 'Perempuan').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-pink-600 h-4 rounded-full"
                  style={{
                    width: `${
                      data.patients.length > 0
                        ? (data.patients.filter((p) => p.Jenis_kelamin === 'Perempuan').length /
                            data.patients.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Kunjungan</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{filteredVisits.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Selesai:</span>
                <span className="font-medium text-green-600">{completedVisits.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Terjadwal:</span>
                <span className="font-medium text-orange-600">{scheduledVisits.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Dibatalkan:</span>
                <span className="font-medium text-red-600">{cancelledVisits.length}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Pasien</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Total Terdaftar:</span>
                <span className="font-medium">{data.patients.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Laki-laki:</span>
                <span className="font-medium text-blue-600">
                  {data.patients.filter((p) => p.Jenis_kelamin === 'Laki-laki').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Perempuan:</span>
                <span className="font-medium text-pink-600">
                  {data.patients.filter((p) => p.Jenis_kelamin === 'Perempuan').length}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Rata-rata Usia:</span>
                <span className="font-medium">
                  {data.patients.length > 0
                    ? Math.round(
                        data.patients.reduce((sum, p) => sum + (p.Umur || 0), 0) /
                          data.patients.length
                      )
                    : 0}{' '}
                  th
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Performa</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Tingkat Penyelesaian:</span>
                <span className="font-medium text-green-600">
                  {filteredVisits.length > 0
                    ? Math.round((completedVisits.length / filteredVisits.length) * 100)
                    : 0}
                  %
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Tingkat Pembatalan:</span>
                <span className="font-medium text-red-600">
                  {filteredVisits.length > 0
                    ? Math.round((cancelledVisits.length / filteredVisits.length) * 100)
                    : 0}
                  %
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
