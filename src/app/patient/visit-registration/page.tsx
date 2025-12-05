'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/auth';

interface Doctor {
  Alamat: string | null;
  ID_karyawan: string;
  Jenis_kelamin: string;
  NIK: string;
  Nama: string;
  No_telpon: string;
  STR: string;
  Shift: string | null;
  Spesialis: string;
  Status: string;
  Tanggal_lahir: string;
  Umur: number;
}

export default function VisitRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    complaint: '',
    payment_method: 'cash',
    insurance_number: '',
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
    console.log(doctors);
    e.preventDefault();

    if (!user?.profileId) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      router.push('/login');
      return;
    }

    if (!formData.doctor_id || !formData.appointment_date || !formData.appointment_time || !formData.complaint) {
      alert('Mohon lengkapi semua data yang wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const appointmentPayload = {
        patient_id: user.profileId,
        doctor_id: parseInt(formData.doctor_id),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        complaint: formData.complaint.trim(),
        registered_by: user.profileId,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentPayload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Pendaftaran berhasil!\n\nNomor Pendaftaran: ${data.appointment_number}\n\nHarap datang 15 menit sebelum jadwal kunjungan.`);
        router.push('/dashboard');
      } else {
        alert(data.error || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
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

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
                    <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Kunjungan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="appointment_date"
                      name="appointment_date"
                      min={getTomorrowDate()}
                      value={formData.appointment_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="appointment_time" className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Kunjungan <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="appointment_time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    >
                      <option value="">Pilih Jam</option>
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Dokter <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="doctor_id"
                      name="doctor_id"
                      value={formData.doctor_id}
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

                  <div className="md:col-span-2">
                    <label htmlFor="complaint" className="block text-sm font-medium text-gray-700 mb-2">
                      Keluhan Utama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="complaint"
                      name="complaint"
                      rows={4}
                      value={formData.complaint}
                      onChange={handleChange}
                      placeholder="Jelaskan keluhan yang Anda rasakan..."
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                  Informasi Pembayaran
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                      Cara Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                    >
                      <option value="cash">Umum/Tunai</option>
                      <option value="insurance">BPJS Kesehatan</option>
                      <option value="debit">Kartu Debit</option>
                      <option value="credit">Kartu Kredit</option>
                      <option value="transfer">Transfer Bank</option>
                    </select>
                  </div>

                  {formData.payment_method === 'insurance' && (
                    <div>
                      <label htmlFor="insurance_number" className="block text-sm font-medium text-gray-700 mb-2">
                        No. BPJS
                      </label>
                      <input
                        type="text"
                        id="insurance_number"
                        name="insurance_number"
                        value={formData.insurance_number}
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
