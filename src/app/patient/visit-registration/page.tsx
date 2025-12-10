'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/auth';

interface Doctor {
  ID_karyawan: string;
  Nama: string;
  Spesialis: string;
  STR?: string;
  Status?: string;
  Shift?: string;
  NIK?: string;
  No_telpon?: string;
}

export default function VisitRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [formData, setFormData] = useState({
    ID_Dokter: '',
    Tanggal: '',
    Waktu_mulai: '',
    Jenis_pembayaran: 'Tunai',
    No_BPJS: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      const doctorsRes = await fetch('/api/doctors');
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        console.log('Doctors API response:', doctorsData);
        setDoctors(doctorsData.doctors || doctorsData || []);
      } else {
        console.error('Failed to fetch doctors:', doctorsRes.status, doctorsRes.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.profileId) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      router.push('/login');
      return;
    }

    if (!formData.ID_Dokter || !formData.Tanggal || !formData.Waktu_mulai) {
      alert('Mohon lengkapi semua data yang wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const appointmentPayload = {
        ID_Pasien: user.profileId,
        ID_Dokter: formData.ID_Dokter,
        Tanggal: formData.Tanggal,
        Waktu_mulai: formData.Waktu_mulai + ':00',
      };

      const appointmentRes = await fetch('/api/pertemuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentPayload),
      });

      const appointmentData = await appointmentRes.json();

      if (appointmentRes.ok) {
        const billingPayload = {
          ID_pasien: user.profileId,
          Jenis_pembayaran: formData.Jenis_pembayaran,
          isLunas: false,
        };

        await fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billingPayload),
        });

        alert(`Pendaftaran berhasil!\n\nNomor Pendaftaran: ${appointmentData.ID_pertemuan}\n\nHarap datang 15 menit sebelum jadwal kunjungan.`);
        router.push('/dashboard');
      } else {
        alert(appointmentData.error || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      alert('Terjadi kesalahan koneksi. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getAvailableTimeSlots = () => {
    const allTimeSlots = [
      '08:00', '09:00', '10:00', '11:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Jika tidak ada tanggal dipilih atau tanggal dipilih bukan hari ini, tampilkan semua
    if (!formData.Tanggal || formData.Tanggal !== getTodayDate()) {
      return allTimeSlots;
    }

    // Jika tanggal dipilih adalah hari ini, filter hanya jam setelah waktu sekarang
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return allTimeSlots.filter(timeSlot => {
      const [hour] = timeSlot.split(':').map(Number);
      // Tambahkan buffer 1 jam untuk persiapan
      return hour > currentHour + 1 || (hour === currentHour + 1 && currentMinute === 0);
    });
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">Form Pendaftaran Kunjungan</h1>
            <p className="text-blue-100">Sistem Informasi Rumah Sakit</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-10">
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                  Informasi Kunjungan
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="Tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Kunjungan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="Tanggal"
                      name="Tanggal"
                      min={getTodayDate()}
                      value={formData.Tanggal}
                      onChange={(e) => {
                        handleChange(e);
                        // Reset waktu ketika tanggal berubah
                        setFormData(prev => ({ ...prev, Waktu_mulai: '' }));
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="Waktu_mulai" className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Kunjungan <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="Waktu_mulai"
                      name="Waktu_mulai"
                      value={formData.Waktu_mulai}
                      onChange={handleChange}
                      required
                      disabled={!formData.Tanggal}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.Tanggal ? 'Pilih tanggal terlebih dahulu' : 'Pilih Jam'}
                      </option>
                      {getAvailableTimeSlots().map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                      {formData.Tanggal === getTodayDate() && getAvailableTimeSlots().length === 0 && (
                        <option value="" disabled>Tidak ada slot waktu tersedia hari ini</option>
                      )}
                    </select>
                    {formData.Tanggal === getTodayDate() && (
                      <p className="mt-2 text-sm text-blue-600">
                        Untuk pendaftaran hari ini, hanya menampilkan jam yang tersedia setelah waktu saat ini
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="ID_Dokter" className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Dokter <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="ID_Dokter"
                      name="ID_Dokter"
                      value={formData.ID_Dokter}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    >
                      <option value="">Pilih Dokter</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.ID_karyawan} value={doctor.ID_karyawan}>
                          {doctor.Nama} - {doctor.Spesialis}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                  Informasi Pembayaran
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="Jenis_pembayaran" className="block text-sm font-medium text-gray-700 mb-2">
                      Cara Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="Jenis_pembayaran"
                      name="Jenis_pembayaran"
                      value={formData.Jenis_pembayaran}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    >
                      <option value="Tunai">Umum/Tunai</option>
                      <option value="BPJS">BPJS Kesehatan</option>
                      <option value="Debit">Kartu Debit</option>
                      <option value="Kredit">Kartu Kredit</option>
                      <option value="Transfer">Transfer Bank</option>
                    </select>
                  </div>

                  {formData.Jenis_pembayaran === 'BPJS' && (
                    <div>
                      <label htmlFor="No_BPJS" className="block text-sm font-medium text-gray-700 mb-2">
                        No. BPJS
                      </label>
                      <input
                        type="text"
                        id="No_BPJS"
                        name="No_BPJS"
                        value={formData.No_BPJS}
                        onChange={handleChange}
                        placeholder="Masukkan nomor BPJS"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Penting:</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Harap datang 15 menit sebelum jadwal kunjungan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Bawa kartu identitas dan kartu berobat (jika pasien lama)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Untuk pembatalan, hubungi rumah sakit minimal H-1</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 mt-10 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Simpan Pendaftaran'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
