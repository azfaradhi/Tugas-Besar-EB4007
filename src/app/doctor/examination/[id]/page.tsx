'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ExaminationPageProps {
  appointmentId: string;
}

interface Patient {
  ID_pasien: string;
  Nama: string;
  Tanggal_lahir: string;
  Umur: number;
  Jenis_kelamin: string;
  No_telpon: string;
  Alamat: string;
  Golongan_darah: string;
  Riwayat_penyakit: string | null;
}

interface Appointment {
  ID_pertemuan: string;
  ID_Pasien: string;
  ID_Dokter: string;
  ID_Perawat: string | null;
  ID_ruangan: string | null;
  Tanggal: string;
  Waktu_mulai: string;
  Waktu_selesai: string | null;
  patient_name: string;
  doctor_specialization: string;
  doctor_name: string;
}

interface Medication {
  id: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  price: number;
}

interface PrescriptionItem {
  medication_id: string;
  medication_name?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalRecord {
  ID_hasil: number;
  diagnosis: string;
  symptoms: string;
  treatment_plan: string;
  notes: string;
  next_step: string;
  created_at: string;
}

interface VitalSigns {
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  respiratory_rate: string;
  oxygen_saturation: string;
  weight: string;
  height: string;
}

export default function ExaminationPage(_: ExaminationPageProps) {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string | undefined;

  // loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // data state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);

  // form state
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: ''
  });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState<'Rawat Jalan' | 'Rawat Inap' | 'Laboratorium'>('Rawat Jalan');

  // prescription state + modal
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState<PrescriptionItem>({
    medication_id: '',
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  // Lab referral state
  const [labReferrals, setLabReferrals] = useState({
    urinTest: false,
    ronsenTest: false,
  });

  useEffect(() => {
    if (!appointmentId) return;
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // pertemuan
      const aptRes = await fetch(`/api/pertemuan?id=${appointmentId}`);
      if (!aptRes.ok) throw new Error('Gagal ambil data pertemuan');
      const aptData = await aptRes.json();
      const appointmentObj = aptData.pertemuans?.[0];
      if (!appointmentObj) throw new Error('Pertemuan tidak ditemukan');
      setAppointment(appointmentObj);

      // pasien
      const patientRes = await fetch(`/api/pasien?id=${appointmentObj.ID_Pasien}`);
      if (!patientRes.ok) throw new Error('Gagal ambil data pasien');
      const patientData = await patientRes.json();
      setPatient(patientData.pasiens?.[0]);

      // rekam medis
      const rekamRes = await fetch(`/api/hasil-pemeriksaan?patientId=${appointmentObj.ID_Pasien}`);
      if (rekamRes.ok) {
        const data = await rekamRes.json();
        setMedicalRecords(data.records || []);
      }

      // obat master
      const medRes = await fetch('/api/obat');
      if (medRes.ok) {
        const medData = await medRes.json();
        const normalized: Medication[] = (medData.obats || []).map((o: any) => ({
          id: o.ID_obat,
          code: '',
          name: o.Nama,
          unit: o.Kategori,
          stock: 0,
          price: Number(o.Harga_satuan ?? 0)
        }));
        setMedications(normalized);
      }

      // wearable (optional)
      // const wearableRes = await fetch(`/api/wearable?patient_id=${appointmentObj.ID_Pasien}`);
      // if (wearableRes.ok) {
      //   const wearable = await wearableRes.json();
      //   setWearableData(wearable.data || []);
      // }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!selectedMedication || !newPrescriptionItem.dosage || !newPrescriptionItem.frequency) {
      alert('Mohon lengkapi data obat.');
      return;
    }
    setPrescriptionItems(prev => [
      ...prev,
      {
        ...newPrescriptionItem,
        medication_id: selectedMedication.id,
        medication_name: selectedMedication.name
      }
    ]);

    setShowMedicationModal(false);
    setSelectedMedication(null);
    setNewPrescriptionItem({
      medication_id: '',
      quantity: 1,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis) {
      alert('Diagnosis harus diisi');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/hasil-pemeriksaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_pertemuan: appointmentId,
          diagnosis,
          symptoms,
          vital_signs: vitalSigns,
          treatment_plan: treatmentPlan,
          notes,                 // tambahan catatan dokter
          next_step: nextStep,   // dropdown langkah selanjutnya
          status: 'completed',
          obat: prescriptionItems.map(item => ({
            ID_Obat: item.medication_id,
            Dosis: item.dosage,
            Frekuensi: item.frequency,
            Durasi_hari: item.duration,
            Qty: item.quantity
          }))
        })
      });

      if (!res.ok) throw new Error('Gagal simpan pemeriksaan');
      const result = await res.json();

      // update tabel rekam medis di UI (tanpa reload)
      setMedicalRecords(prev => [
        {
          ID_hasil: Number(result.ID_hasil),
          diagnosis,
          symptoms,
          treatment_plan: treatmentPlan,
          notes,
          next_step: nextStep,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);

      // reset form
      setDiagnosis('');
      setSymptoms('');
      setTreatmentPlan('');
      setNotes('');
      setNextStep('Rawat Jalan');
      setPrescriptionItems([]);
      setVitalSigns({
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: ''
      });

      alert('Pemeriksaan berhasil disimpan');
      // router.push('/dashboard'); // kalau mau balik dashboard, aktifkan ini
    } catch (error) {
      console.error('Error saving examination:', error);
      alert('Gagal menyimpan pemeriksaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-black">Loading...</div>;
  if (!patient || !appointment) return <div className="p-8 text-black">Data tidak ditemukan</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto text-black">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-6">Pemeriksaan Pasien</h2>

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Informasi Pasien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm">No. Pasien</p>
            <p className="font-semibold">{patient.ID_pasien}</p>
          </div>
          <div>
            <p className="text-sm">Nama</p>
            <p className="font-semibold">{patient.Nama}</p>
          </div>
          <div>
            <p className="text-sm">Usia / Jenis Kelamin</p>
            <p className="font-semibold">
              {patient.Umur} tahun / {patient.Jenis_kelamin === 'male' ? 'Laki-laki' : 'Perempuan'}
            </p>
          </div>
          <div>
            <p className="text-sm">Golongan Darah</p>
            <p className="font-semibold">{patient.Golongan_darah || '-'}</p>
          </div>
          <div>
            <p className="text-sm">Telepon</p>
            <p className="font-semibold">{patient.No_telpon}</p>
          </div>
          <div>
            <p className="text-sm">Tanggal Kunjungan</p>
            <p className="font-semibold">
              {new Date(appointment.Tanggal).toLocaleDateString('id-ID')} — {appointment.Waktu_mulai}
            </p>
          </div>
        </div>
      </div>

      {/* Wearable (optional) */}
      {wearableData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Data Wearable Device</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wearableData.slice(0, 4).map((data, index) => (
              <div key={index} className="border rounded-lg p-3">
                <p className="text-xs">{data.measurement_type}</p>
                <p className="text-lg font-bold">
                  {data.value} {data.unit}
                </p>
                <p className="text-xs">{new Date(data.measured_at).toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examination */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Detail Pemeriksaan</h3>

        <label className="block mb-2 font-semibold">Gejala</label>
        <textarea
          rows={2}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block mb-2 font-semibold">Diagnosis</label>
        <textarea
          rows={2}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          required
        />

        <label className="block mb-2 font-semibold">Rencana Perawatan</label>
        <textarea
          rows={2}
          value={treatmentPlan}
          onChange={(e) => setTreatmentPlan(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block mb-2 font-semibold">Catatan Tambahan</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block mb-2 font-semibold">Langkah Selanjutnya</label>
        <select
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value as any)}
          className="w-full border rounded p-2 mb-4"
        >
          <option>Rawat Jalan</option>
          <option>Rawat Inap</option>
          <option>Laboratorium</option>
        </select>
      </div>

      {/* Prescription */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Resep Obat</h3>
          <button
            onClick={() => setShowMedicationModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Tambah Obat
          </button>
        </div>

        {prescriptionItems.length === 0 ? (
          <p>Tidak ada obat yang diresepkan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium">Nama Obat</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Dosis</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Frekuensi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Durasi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Jumlah</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {prescriptionItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.medication_name}</td>
                    <td className="px-4 py-2 text-sm">{item.dosage}</td>
                    <td className="px-4 py-2 text-sm">{item.frequency}</td>
                    <td className="px-4 py-2 text-sm">{item.duration}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Batal
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving || !diagnosis}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
        </button>
      </div>

      {/* Medication Modal (tetap ADA) */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Tambah Obat</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Obat</label>
                <select
                  value={selectedMedication?.id || ''}
                  onChange={(e) => {
                    const med = medications.find(m => m.id === e.target.value);
                    setSelectedMedication(med || null);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Pilih Obat --</option>
                  {medications.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} {med.unit ? `(${med.unit})` : ''} {med.price ? `- Rp${med.price}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosis</label>
                  <input
                    type="text"
                    placeholder="Contoh: 500mg"
                    value={newPrescriptionItem.dosage}
                    onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, dosage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frekuensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3x sehari"
                    value={newPrescriptionItem.frequency}
                    onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, frequency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Durasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 7 hari"
                    value={newPrescriptionItem.duration}
                    onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, duration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={newPrescriptionItem.quantity}
                    onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instruksi</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Diminum setelah makan"
                  value={newPrescriptionItem.instructions}
                  onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, instructions: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMedicationModal(false);
                  setSelectedMedication(null);
                  setNewPrescriptionItem({
                    medication_id: '',
                    quantity: 1,
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                  });
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAddMedication}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
