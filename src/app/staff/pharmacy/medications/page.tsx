'use client';

import { useEffect, useState } from 'react';

interface Medication {
  ID_obat: string;
  Nama: string;
  Kategori: string;
  Aturan_pakai: string;
  Harga_satuan: number;
  Stok?: number;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    Nama: '',
    Kategori: 'Tablet',
    Aturan_pakai: '',
    Harga_satuan: 0,
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/obat');
      if (response.ok) {
        const data = await response.json();
        setMedications(data.obats || []);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/obat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Obat berhasil ditambahkan!');
        setShowAddModal(false);
        setFormData({ Nama: '', Kategori: 'Tablet', Aturan_pakai: '', Harga_satuan: 0 });
        fetchMedications();
      } else {
        alert('Gagal menambahkan obat');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleEditMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedication) return;

    try {
      const response = await fetch('/api/obat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_obat: selectedMedication.ID_obat,
          ...formData,
        }),
      });

      if (response.ok) {
        alert('Obat berhasil diperbarui!');
        setShowEditModal(false);
        setSelectedMedication(null);
        setFormData({ Nama: '', Kategori: 'Tablet', Aturan_pakai: '', Harga_satuan: 0 });
        fetchMedications();
      } else {
        alert('Gagal memperbarui obat');
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus obat ini?')) return;

    try {
      const response = await fetch(`/api/obat?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Obat berhasil dihapus!');
        fetchMedications();
      } else {
        alert('Gagal menghapus obat');
      }
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Terjadi kesalahan');
    }
  };

  const openEditModal = (medication: Medication) => {
    setSelectedMedication(medication);
    setFormData({
      Nama: medication.Nama,
      Kategori: medication.Kategori,
      Aturan_pakai: medication.Aturan_pakai || '',
      Harga_satuan: medication.Harga_satuan || 0,
    });
    setShowEditModal(true);
  };

  const categories = ['all', 'Kapsul', 'Tablet', 'Cair', 'Injeksi', 'Salep', 'Lainnya'];

  const filteredMedications = medications.filter((med) => {
    const matchesCategory = categoryFilter === 'all' || med.Kategori === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      med.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.ID_obat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Stok Obat</h1>
        <p className="text-gray-600">Kelola data obat dan persediaan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Obat</h3>
          <p className="text-3xl font-bold text-indigo-600">{medications.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Kategori Tablet</h3>
          <p className="text-3xl font-bold text-blue-600">
            {medications.filter((m) => m.Kategori === 'Tablet').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Kategori Kapsul</h3>
          <p className="text-3xl font-bold text-green-600">
            {medications.filter((m) => m.Kategori === 'Kapsul').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Lainnya</h3>
          <p className="text-3xl font-bold text-purple-600">
            {medications.filter((m) => !['Tablet', 'Kapsul'].includes(m.Kategori)).length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama obat atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            + Tambah Obat
          </button>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Obat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Obat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aturan Pakai
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Satuan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada obat ditemukan
                  </td>
                </tr>
              ) : (
                filteredMedications.map((med) => (
                  <tr key={med.ID_obat} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {med.ID_obat}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {med.Nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          med.Kategori === 'Tablet'
                            ? 'bg-blue-100 text-blue-800'
                            : med.Kategori === 'Kapsul'
                            ? 'bg-green-100 text-green-800'
                            : med.Kategori === 'Cair'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {med.Kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {med.Aturan_pakai || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      Rp {(med.Harga_satuan || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => openEditModal(med)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.ID_obat)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tambah Obat Baru</h2>
            <form onSubmit={handleAddMedication}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Obat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Nama}
                    onChange={(e) => setFormData({ ...formData, Nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.Kategori}
                    onChange={(e) => setFormData({ ...formData, Kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Cair">Cair</option>
                    <option value="Injeksi">Injeksi</option>
                    <option value="Salep">Salep</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aturan Pakai
                  </label>
                  <input
                    type="text"
                    value={formData.Aturan_pakai}
                    onChange={(e) => setFormData({ ...formData, Aturan_pakai: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.Harga_satuan}
                    onChange={(e) =>
                      setFormData({ ...formData, Harga_satuan: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ Nama: '', Kategori: 'Tablet', Aturan_pakai: '', Harga_satuan: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Obat</h2>
            <form onSubmit={handleEditMedication}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Obat
                  </label>
                  <input
                    type="text"
                    value={selectedMedication.ID_obat}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Obat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Nama}
                    onChange={(e) => setFormData({ ...formData, Nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.Kategori}
                    onChange={(e) => setFormData({ ...formData, Kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Cair">Cair</option>
                    <option value="Injeksi">Injeksi</option>
                    <option value="Salep">Salep</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aturan Pakai
                  </label>
                  <input
                    type="text"
                    value={formData.Aturan_pakai}
                    onChange={(e) => setFormData({ ...formData, Aturan_pakai: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.Harga_satuan}
                    onChange={(e) =>
                      setFormData({ ...formData, Harga_satuan: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMedication(null);
                    setFormData({ Nama: '', Kategori: 'Tablet', Aturan_pakai: '', Harga_satuan: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
