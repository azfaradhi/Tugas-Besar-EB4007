'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
  ID_pasien: string;
  Nama: string;
  NIK: string;
}

interface Doctor {
  ID_karyawan: string;
  Nama: string;
  Spesialis: string;
}

interface Room {
  ID_ruangan: string;
}

export default function VisitRegistrationPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  const [formData, setFormData] = useState({
    ID_Pasien: '',
    ID_Dokter: '',
    ID_ruangan: '',
    Tanggal: '',
    Waktu_mulai: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchPatient) {
      const filtered = patients.filter(
        (p) =>
          p.Nama.toLowerCase().includes(searchPatient.toLowerCase()) ||
          p.NIK.includes(searchPatient)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [searchPatient, patients]);

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes, roomsRes] = await Promise.all([
        fetch('/api/pasien'),
        fetch('/api/karyawan?role=doctor'),
        fetch('/api/ruangan'),
      ]);

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data.pasiens || []);
      }

      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setDoctors(data.karyawans || []);
      }

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(data.ruangans || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setFormData({ ...formData, ID_Pasien: patient.ID_pasien });
    setSearchPatient(patient.Nama);
    setFilteredPatients([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/pertemuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'scheduled',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mendaftarkan kunjungan');
      }

      const data = await response.json();
      alert('Kunjungan berhasil didaftarkan!\nID Pertemuan: ' + data.ID_pertemuan);
      router.push('/staff/registration/queue');
    } catch (error: any) {
      console.error('Error creating visit:', error);
      alert(error.message || 'Terjadi kesalahan saat mendaftarkan kunjungan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pendaftaran Kunjungan</h1>
        <p className="text-gray-600">Daftarkan kunjungan pasien ke dokter</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Patient Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Pasien <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Cari berdasarkan nama atau NIK..."
              />
              {filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.ID_pasien}
                      onClick={() => handleSelectPatient(patient)}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{patient.Nama}</p>
                      <p className="text-sm text-gray-600">NIK: {patient.NIK}</p>
                      <p className="text-xs text-gray-500">ID: {patient.ID_pasien}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formData.ID_Pasien && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Pasien dipilih: ID {formData.ID_Pasien}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokter <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ID_Dokter}
                onChange={(e) => setFormData({ ...formData, ID_Dokter: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Pilih dokter</option>
                {doctors.map((doctor) => (
                  <option key={doctor.ID_karyawan} value={doctor.ID_karyawan}>
                    {doctor.Nama} - {doctor.Spesialis || 'Umum'}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruangan
              </label>
              <select
                value={formData.ID_ruangan}
                onChange={(e) => setFormData({ ...formData, ID_ruangan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Pilih ruangan (opsional)</option>
                {rooms.map((room) => (
                  <option key={room.ID_ruangan} value={room.ID_ruangan}>
                    {room.ID_ruangan}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.Tanggal}
                onChange={(e) => setFormData({ ...formData, Tanggal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.Waktu_mulai}
                onChange={(e) => setFormData({ ...formData, Waktu_mulai: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading || !formData.ID_Pasien}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Menyimpan...' : 'Daftar Kunjungan'}
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
