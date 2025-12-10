'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

interface PharmacyDashboardProps {
  user: SessionUser;
}

interface HasilPemeriksaan {
  ID_hasil: string;
  ID_pertemuan: string;
  tanggal_pertemuan: string;
  nama_pasien: string;
  nama_dokter: string;
  obat: Array<{
    ID_Obat: string;
    Nama: string;
    Kategori: string;
  }>;
}

interface Obat {
  ID_obat: string;
  Nama: string;
  Kategori: string;
}

export default function PharmacyDashboard({ user }: PharmacyDashboardProps) {
  const [hasilPemeriksaan, setHasilPemeriksaan] = useState<HasilPemeriksaan[]>([]);
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddObatModal, setShowAddObatModal] = useState(false);
  const [newObat, setNewObat] = useState({ Nama: '', Kategori: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const hasilRes = await fetch('/api/hasil-pemeriksaan');
      if (hasilRes.ok) {
        const data = await hasilRes.json();
        setHasilPemeriksaan(data.hasil_pemeriksaan || []);
      }

      const obatRes = await fetch('/api/obat');
      if (obatRes.ok) {
        const data = await obatRes.json();
        setObatList(data.obats || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddObat = async () => {
    if (!newObat.Nama || !newObat.Kategori) {
      alert('Nama dan Kategori harus diisi');
      return;
    }

    try {
      const res = await fetch('/api/obat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObat),
      });

      if (res.ok) {
        alert('Obat berhasil ditambahkan');
        setShowAddObatModal(false);
        setNewObat({ Nama: '', Kategori: '' });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menambahkan obat');
      }
    } catch (error) {
      console.error('Error adding obat:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleDeleteObat = async (id: string) => {
    if (!confirm('Yakin ingin menghapus obat ini?')) return;

    try {
      const res = await fetch(`/api/obat?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Obat berhasil dihapus');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menghapus obat');
      }
    } catch (error) {
      console.error('Error deleting obat:', error);
      alert('Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredObat = obatList.filter(obat =>
    obat.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obat.Kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasilWithObat = hasilPemeriksaan.filter(h => h.obat && h.obat.length > 0);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Apotek</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Obat</p>
                <p className="text-3xl font-bold text-gray-900">{obatList.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Resep Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">{hasilWithObat.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Kategori Obat</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(obatList.map(o => o.Kategori)).size}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Resep Pasien</h2>
            </div>

            {hasilWithObat.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Belum ada resep</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {hasilWithObat.map((hasil) => (
                  <div key={hasil.ID_hasil} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{hasil.nama_pasien}</p>
                      <p className="text-sm text-gray-600">Dokter: {hasil.nama_dokter}</p>
                      <p className="text-xs text-gray-500">{hasil.tanggal_pertemuan}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Obat yang diresepkan:</p>
                      <ul className="space-y-1">
                        {hasil.obat.map((obat, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {obat.Nama} ({obat.Kategori})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Daftar Obat</h2>
              <button
                onClick={() => setShowAddObatModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Tambah Obat
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari obat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-900"
            />

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredObat.map((obat) => (
                <div key={obat.ID_obat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{obat.Nama}</p>
                    <p className="text-sm text-gray-600">{obat.Kategori}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteObat(obat.ID_obat)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddObatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Tambah Obat Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Obat</label>
                <input
                  type="text"
                  value={newObat.Nama}
                  onChange={(e) => setNewObat({ ...newObat, Nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={newObat.Kategori}
                  onChange={(e) => setNewObat({ ...newObat, Kategori: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Antibiotik">Antibiotik</option>
                  <option value="Analgesik">Analgesik</option>
                  <option value="Antipiretik">Antipiretik</option>
                  <option value="Vitamin">Vitamin</option>
                  <option value="Antihistamin">Antihistamin</option>
                  <option value="Antasida">Antasida</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddObatModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleAddObat}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
