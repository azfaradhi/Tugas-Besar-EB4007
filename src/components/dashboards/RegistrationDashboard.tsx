'use client';

import { useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface RegistrationDashboardProps {
  user: SessionUser;
}

interface Pasien {
  ID_pasien: string;
  Nama: string;
  NIK: string;
  Tanggal_lahir: string;
  Umur: number;
  Jenis_kelamin: string;
  No_telpon: string;
  Alamat: string;
  Golongan_darah: string;
}

interface Pertemuan {
  ID_pertemuan: string;
  ID_Pasien: string;
  ID_Dokter: string;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  nama_pasien: string;
  nama_dokter: string;
  Spesialis: string;
}

export default function RegistrationDashboard({ user }: RegistrationDashboardProps) {
  const router = useRouter();
  const [pasiens, setPasiens] = useState<Pasien[]>([]);
  const [pertemuans, setPertemuans] = useState<Pertemuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPatient, setNewPatient] = useState({
    Nama: '',
    NIK: '',
    Tanggal_lahir: '',
    Jenis_kelamin: 'L',
    No_telpon: '',
    Alamat: '',
    Golongan_darah: '',
    Riwayat_penyakit: '',
    Nama_ibu_kandung: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pasienRes = await fetch('/api/pasien');
      if (pasienRes.ok) {
        const data = await pasienRes.json();
        setPasiens(data.pasiens || []);
      }

      const pertemuanRes = await fetch('/api/pertemuan');
      if (pertemuanRes.ok) {
        const data = await pertemuanRes.json();
        setPertemuans(data.pertemuans || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.Nama || !newPatient.NIK || !newPatient.Tanggal_lahir || !newPatient.Jenis_kelamin) {
      alert('Nama, NIK, Tanggal Lahir, dan Jenis Kelamin harus diisi');
      return;
    }

    try {
      const res = await fetch('/api/pasien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      if (res.ok) {
        alert('Pasien berhasil didaftarkan');
        setShowAddPatientModal(false);
        setNewPatient({
          Nama: '',
          NIK: '',
          Tanggal_lahir: '',
          Jenis_kelamin: 'L',
          No_telpon: '',
          Alamat: '',
          Golongan_darah: '',
          Riwayat_penyakit: '',
          Nama_ibu_kandung: '',
        });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal mendaftarkan pasien');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
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

  const filteredPasiens = pasiens.filter(p =>
    p.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.NIK.includes(searchTerm) ||
    (p.No_telpon && p.No_telpon.includes(searchTerm))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPertemuans = pertemuans.filter(p => {
    const pDate = new Date(p.Tanggal);
    pDate.setHours(0, 0, 0, 0);
    return pDate.getTime() === today.getTime();
  });

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Bagian Pendaftaran</h1>
          <p className="text-gray-600">Selamat datang, {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Pasien</p>
                <p className="text-3xl font-bold text-gray-900">{pasiens.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Kunjungan Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900">{todayPertemuans.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Pertemuan</p>
                <p className="text-3xl font-bold text-gray-900">{pertemuans.length}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Daftar Pasien</h2>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Tambah Pasien
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari pasien (Nama, NIK, No. Telpon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-900"
            />

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredPasiens.map((pasien) => (
                <div key={pasien.ID_pasien} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pasien.Nama}</p>
                      <p className="text-sm text-gray-600">NIK: {pasien.NIK}</p>
                      <p className="text-sm text-gray-600">
                        {pasien.Jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}, {pasien.Umur} tahun
                      </p>
                      {pasien.No_telpon && (
                        <p className="text-sm text-gray-600">Telp: {pasien.No_telpon}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{pasien.ID_pasien}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Kunjungan Hari Ini</h2>
            </div>

            {todayPertemuans.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Tidak ada kunjungan hari ini</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {todayPertemuans.map((pertemuan) => (
                  <div key={pertemuan.ID_pertemuan} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{pertemuan.nama_pasien}</p>
                        <p className="text-sm text-gray-600">Dokter: {pertemuan.nama_dokter}</p>
                        <p className="text-sm text-gray-600">{pertemuan.Spesialis}</p>
                      </div>
                      {pertemuan.Waktu_selesai ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Selesai
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Terjadwal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{pertemuan.Waktu_mulai}</span>
                      <span className="text-xs text-gray-500">{pertemuan.ID_pertemuan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Tambah Pasien Baru</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newPatient.Nama}
                  onChange={(e) => setNewPatient({ ...newPatient, Nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK *</label>
                <input
                  type="text"
                  value={newPatient.NIK}
                  onChange={(e) => setNewPatient({ ...newPatient, NIK: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir *</label>
                <input
                  type="date"
                  value={newPatient.Tanggal_lahir}
                  onChange={(e) => setNewPatient({ ...newPatient, Tanggal_lahir: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin *</label>
                <select
                  value={newPatient.Jenis_kelamin}
                  onChange={(e) => setNewPatient({ ...newPatient, Jenis_kelamin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telpon</label>
                <input
                  type="text"
                  value={newPatient.No_telpon}
                  onChange={(e) => setNewPatient({ ...newPatient, No_telpon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Golongan Darah</label>
                <select
                  value={newPatient.Golongan_darah}
                  onChange={(e) => setNewPatient({ ...newPatient, Golongan_darah: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                >
                  <option value="">Pilih</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ibu Kandung</label>
                <input
                  type="text"
                  value={newPatient.Nama_ibu_kandung}
                  onChange={(e) => setNewPatient({ ...newPatient, Nama_ibu_kandung: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={newPatient.Alamat}
                  onChange={(e) => setNewPatient({ ...newPatient, Alamat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Riwayat Penyakit</label>
                <textarea
                  value={newPatient.Riwayat_penyakit}
                  onChange={(e) => setNewPatient({ ...newPatient, Riwayat_penyakit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleAddPatient}
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
