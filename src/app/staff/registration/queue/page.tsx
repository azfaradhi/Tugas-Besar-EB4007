'use client';

import { useState, useEffect } from 'react';

interface QueueItem {
  ID_pertemuan: string;
  ID_Pasien: string;
  ID_Dokter: string;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  nama_pasien: string;
  nama_dokter: string;
  spesialis: string;
  ID_ruangan: string | null;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/pertemuan');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.pertemuans || []);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (item: QueueItem) => {
    const appointmentDate = new Date(item.Tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return appointmentDate.getTime() === today.getTime();
      case 'upcoming':
        return appointmentDate >= today;
      default:
        return true;
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesDate = filterByDate(item);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  const todayQueue = queue.filter((item) => {
    const appointmentDate = new Date(item.Tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate.getTime() === today.getTime() && item.status === 'scheduled';
  });

  const handleUpdateStatus = async (id: string, newStatus: 'completed' | 'cancelled') => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return;

    try {
      const response = await fetch('/api/pertemuan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_pertemuan: id,
          status: newStatus,
          Waktu_selesai: newStatus === 'completed' ? new Date().toLocaleTimeString('en-GB') : null,
        }),
      });

      if (response.ok) {
        alert('Status berhasil diperbarui!');
        fetchQueue();
      } else {
        alert('Gagal memperbarui status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Terjadi kesalahan');
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Antrian Kunjungan</h1>
        <p className="text-gray-600">Monitoring antrian pasien hari ini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Antrian Hari Ini</h3>
          <p className="text-4xl font-bold text-indigo-600">{todayQueue.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Menunggu</h3>
          <p className="text-4xl font-bold text-orange-600">
            {filteredQueue.filter((q) => q.status === 'scheduled').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selesai</h3>
          <p className="text-4xl font-bold text-green-600">
            {filteredQueue.filter((q) => q.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Dibatalkan</h3>
          <p className="text-4xl font-bold text-red-600">
            {filteredQueue.filter((q) => q.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'upcoming'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yang Akan Datang
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'scheduled'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Antrian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruangan
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
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada antrian
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item, index) => (
                  <tr key={item.ID_pertemuan} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(item.Tanggal).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-gray-500">{item.Waktu_mulai}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.nama_pasien}</p>
                        <p className="text-gray-500 text-xs">{item.ID_Pasien}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.nama_dokter}</p>
                        <p className="text-gray-500 text-xs">{item.spesialis}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.ID_ruangan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.status === 'scheduled' && (
                        <span className="px-3 py-1 inline-block bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          Menunggu
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="px-3 py-1 inline-block bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Selesai
                        </span>
                      )}
                      {item.status === 'cancelled' && (
                        <span className="px-3 py-1 inline-block bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Dibatalkan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {item.status === 'scheduled' && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleUpdateStatus(item.ID_pertemuan, 'completed')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Selesai
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.ID_pertemuan, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                      {item.status !== 'scheduled' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
