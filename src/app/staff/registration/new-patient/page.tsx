'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPatientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    Nama: '',
    Tanggal_lahir: '',
    Jenis_kelamin: 'Laki-laki',
    No_telpon: '',
    Alamat: '',
    Golongan_darah: '',
    Riwayat_penyakit: '',
  });
  const [loading, setLoading] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate age from birth date
      const birthDate = new Date(formData.Tanggal_lahir);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      // Create patient
      const patientResponse = await fetch('/api/pasien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          Umur: age,
        }),
      });

      if (!patientResponse.ok) {
        const error = await patientResponse.json();
        throw new Error(error.error || 'Gagal mendaftarkan pasien');
      }

      const patientData = await patientResponse.json();

      // Create user account if requested
      if (createUser && userData.username && userData.password) {
        const userResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userData.username,
            password: userData.password,
            role: 'patient',
          }),
        });

        if (!userResponse.ok) {
          console.warn('Failed to create user account, but patient was created');
        }
      }

      alert('Pasien berhasil didaftarkan!\nID Pasien: ' + patientData.ID_pasien);
      router.push('/staff/registration/patients');
    } catch (error: any) {
      console.error('Error creating patient:', error);
      alert(error.message || 'Terjadi kesalahan saat mendaftarkan pasien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pendaftaran Pasien Baru</h1>
        <p className="text-gray-600">Daftarkan pasien baru ke sistem</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.Nama}
                onChange={(e) => setFormData({ ...formData, Nama: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.Tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, Tanggal_lahir: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.Jenis_kelamin}
                onChange={(e) => setFormData({ ...formData, Jenis_kelamin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* No Telpon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Telepon
              </label>
              <input
                type="tel"
                value={formData.No_telpon}
                onChange={(e) => setFormData({ ...formData, No_telpon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            {/* Golongan Darah */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Golongan Darah
              </label>
              <select
                value={formData.Golongan_darah}
                onChange={(e) => setFormData({ ...formData, Golongan_darah: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Pilih golongan darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

          </div>

          {/* Alamat */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat
            </label>
            <textarea
              rows={3}
              value={formData.Alamat}
              onChange={(e) => setFormData({ ...formData, Alamat: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Alamat lengkap"
            />
          </div>

          {/* Riwayat Penyakit */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Riwayat Penyakit
            </label>
            <textarea
              rows={3}
              value={formData.Riwayat_penyakit}
              onChange={(e) => setFormData({ ...formData, Riwayat_penyakit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Riwayat penyakit (jika ada)"
            />
          </div>

          {/* Create User Account Section */}
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="createUser"
                checked={createUser}
                onChange={(e) => setCreateUser(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="createUser" className="ml-2 text-sm font-medium text-gray-700">
                Buat akun login untuk pasien
              </label>
            </div>

            {createUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={createUser}
                    value={userData.username}
                    onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Username untuk login"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required={createUser}
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Password"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Menyimpan...' : 'Daftar Pasien'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
