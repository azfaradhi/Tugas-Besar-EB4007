'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DoctorFormData {
  Nama: string;
  Jenis_Kelamin: string;
  Tanggal_Lahir: string;
  Alamat: string;
  No_Telepon: string;
  Email: string;
  Spesialisasi: string;
  Nomor_Lisensi: string;
  Tahun_Mulai_Praktik: number;
  ID_Department: string;
}

interface StaffFormData {
  Nama: string;
  Jenis_Kelamin: string;
  Tanggal_Lahir: string;
  Alamat: string;
  No_Telepon: string;
  Email: string;
  Gaji: number;
  Shift?: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const [doctorData, setDoctorData] = useState<DoctorFormData>({
    Nama: '',
    Jenis_Kelamin: 'Laki-laki',
    Tanggal_Lahir: '',
    Alamat: '',
    No_Telepon: '',
    Email: '',
    Spesialisasi: '',
    Nomor_Lisensi: '',
    Tahun_Mulai_Praktik: new Date().getFullYear(),
    ID_Department: ''
  });

  const [staffData, setStaffData] = useState<StaffFormData>({
    Nama: '',
    Jenis_Kelamin: 'Laki-laki',
    Tanggal_Lahir: '',
    Alamat: '',
    No_Telepon: '',
    Email: '',
    Gaji: 5000000,
    Shift: 'Pagi'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !role) {
      setError('Username, password, dan role harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    let profileData: any = {};

    if (role === 'doctor') {
      if (!doctorData.Nama || !doctorData.Spesialisasi || !doctorData.ID_Department) {
        setError('Nama, spesialisasi, dan departemen harus diisi untuk dokter');
        return;
      }
      profileData = doctorData;
    } else {
      if (!staffData.Nama) {
        setError('Nama harus diisi');
        return;
      }
      profileData = staffData;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          role,
          profileData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat pengguna');
      }

      setSuccess('Pengguna berhasil dibuat');
      setTimeout(() => {
        router.push('/staff/registration/users');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    { id: 'DEP001', name: 'Umum' },
    { id: 'DEP002', name: 'Penyakit Dalam' },
    { id: 'DEP003', name: 'Radiologi' },
    { id: 'DEP004', name: 'Laboratorium' },
    { id: 'DEP005', name: 'Bedah' },
    { id: 'DEP006', name: 'Anak' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            &larr; Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Pengguna Baru</h1>
          <p className="text-gray-600 mt-1">Buat akun untuk staff atau dokter</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informasi Akun
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Pilih Role --</option>
                <option value="doctor">Dokter</option>
                <option value="staff_pharmacy">Staff Farmasi</option>
                <option value="staff_lab">Staff Laboratorium</option>
                <option value="staff_cashier">Staff Kasir</option>
              </select>
            </div>
          </div>

          {role === 'doctor' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Informasi Dokter
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={doctorData.Nama}
                    onChange={(e) => setDoctorData({ ...doctorData, Nama: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={doctorData.Jenis_Kelamin}
                    onChange={(e) => setDoctorData({ ...doctorData, Jenis_Kelamin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={doctorData.Tanggal_Lahir}
                    onChange={(e) => setDoctorData({ ...doctorData, Tanggal_Lahir: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={doctorData.No_Telepon}
                    onChange={(e) => setDoctorData({ ...doctorData, No_Telepon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={doctorData.Email}
                    onChange={(e) => setDoctorData({ ...doctorData, Email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spesialisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={doctorData.Spesialisasi}
                    onChange={(e) => setDoctorData({ ...doctorData, Spesialisasi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Kardiologi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departemen <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={doctorData.ID_Department}
                    onChange={(e) => setDoctorData({ ...doctorData, ID_Department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Pilih Departemen --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Lisensi
                  </label>
                  <input
                    type="text"
                    value={doctorData.Nomor_Lisensi}
                    onChange={(e) => setDoctorData({ ...doctorData, Nomor_Lisensi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun Mulai Praktik
                  </label>
                  <input
                    type="number"
                    value={doctorData.Tahun_Mulai_Praktik}
                    onChange={(e) => setDoctorData({ ...doctorData, Tahun_Mulai_Praktik: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={doctorData.Alamat}
                  onChange={(e) => setDoctorData({ ...doctorData, Alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}

          {(role === 'staff_pharmacy' || role === 'staff_lab' || role === 'staff_cashier') && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Informasi Staff
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffData.Nama}
                    onChange={(e) => setStaffData({ ...staffData, Nama: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={staffData.Jenis_Kelamin}
                    onChange={(e) => setStaffData({ ...staffData, Jenis_Kelamin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={staffData.Tanggal_Lahir}
                    onChange={(e) => setStaffData({ ...staffData, Tanggal_Lahir: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={staffData.No_Telepon}
                    onChange={(e) => setStaffData({ ...staffData, No_Telepon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={staffData.Email}
                    onChange={(e) => setStaffData({ ...staffData, Email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gaji
                  </label>
                  <input
                    type="number"
                    value={staffData.Gaji}
                    onChange={(e) => setStaffData({ ...staffData, Gaji: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                {(role === 'staff_pharmacy' || role === 'staff_cashier') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shift
                    </label>
                    <select
                      value={staffData.Shift}
                      onChange={(e) => setStaffData({ ...staffData, Shift: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Pagi">Pagi</option>
                      <option value="Siang">Siang</option>
                      <option value="Malam">Malam</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={staffData.Alamat}
                  onChange={(e) => setStaffData({ ...staffData, Alamat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
