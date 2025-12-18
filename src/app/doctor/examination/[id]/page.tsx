'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Jenis_kelamin: string; // schema: 'Laki-laki' | 'Perempuan'
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
  duration: number; // IMPORTANT: schema INT (Durasi_hari)
  instructions: string;
}

interface MedicalRecord {
  ID_hasil: string; // IMPORTANT: schema VARCHAR(20)
  diagnosis: string;
  symptoms: string;
  treatment_plan: string;
  notes: string;
  next_step: string;
  created_at: string;
}

type NextStep = 'Rawat Jalan' | 'Rawat Inap' | 'Laboratorium';
type LabTestType = '' | 'urin' | 'ronsen';

function prettyGender(g: string | null | undefined) {
  if (!g) return '-';
  // schema sudah pakai "Laki-laki" / "Perempuan"
  if (g === 'Laki-laki' || g === 'Perempuan') return g;

  // fallback kalau data lama masih 'male'/'female' atau 'L'/'P'
  if (g === 'male' || g === 'L') return 'Laki-laki';
  if (g === 'female' || g === 'P') return 'Perempuan';
  return g;
}

export default function ExaminationPage(_: ExaminationPageProps) {
  const router = useRouter();
  const params = useParams();
  const appointmentId = (params?.id as string | undefined) ?? (params?.appointmentId as string | undefined);

  // loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // data state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);
  const [existingHasilId, setExistingHasilId] = useState<string | null>(null);

  // form state
  const [detakJantung, setDetakJantung] = useState<number>(0);
  const [kadarOksigen, setKadarOksigen] = useState<number>(0);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState<NextStep>('Rawat Jalan');

  const [labTestType, setLabTestType] = useState<LabTestType>('');

  // prescription state + modal
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState<PrescriptionItem>({
    medication_id: '',
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: 1,
    instructions: '',
  });

  useEffect(() => {
    if (!appointmentId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // kalau bukan Lab, reset pilihan lab
  useEffect(() => {
    if (nextStep !== 'Laboratorium') setLabTestType('');
  }, [nextStep]);

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
      setPatient(patientData.pasiens?.[0] ?? null);

      // rekam medis
      const rekamRes = await fetch(`/api/hasil-pemeriksaan?patientId=${appointmentObj.ID_Pasien}`);
      if (rekamRes.ok) {
        const data = await rekamRes.json();
        setMedicalRecords(data.records || []);
      }

      // Check if there's already a Hasil_Pemeriksaan for this pertemuan
      const hasilRes = await fetch(`/api/hasil-pemeriksaan?pertemuanId=${appointmentId}`);
      if (hasilRes.ok) {
        const hasilData = await hasilRes.json();
        if (hasilData.hasil_pemeriksaan && hasilData.hasil_pemeriksaan.length > 0) {
          const existingHasil = hasilData.hasil_pemeriksaan[0];
          setExistingHasilId(existingHasil.ID_hasil);

          // Pre-fill form with existing data
          if (existingHasil.detak_jantung) setDetakJantung(existingHasil.detak_jantung);
          if (existingHasil.kadar_oksigen) setKadarOksigen(existingHasil.kadar_oksigen);
          if (existingHasil.symptoms) setSymptoms(existingHasil.symptoms);
          if (existingHasil.diagnosis) setDiagnosis(existingHasil.diagnosis);
          if (existingHasil.treatment_plan) setTreatmentPlan(existingHasil.treatment_plan);
          if (existingHasil.notes) setNotes(existingHasil.notes);

          console.log('Found existing Hasil_Pemeriksaan, pre-filling form:', existingHasil.ID_hasil);
        }
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
          stock: Number(o.Stok ?? 0),
          price: Number(o.Harga_satuan ?? 0),
        }));
        setMedications(normalized);
      }

      // Fetch latest monitoring session for this patient
      const monitoringRes = await fetch(`/api/monitoring/results?patientId=${appointmentObj.ID_Pasien}`);
      if (monitoringRes.ok) {
        const monitoringData = await monitoringRes.json();
        const latestSession = monitoringData.results?.[0];
        if (latestSession) {
          // Auto-fill vital signs from latest monitoring session
          const avgHr = Math.round(latestSession.summary?.heartRate?.average || 0);
          const avgSpo2 = Math.round(latestSession.summary?.spo2?.average || 0);
          if (avgHr > 0) setDetakJantung(avgHr);
          if (avgSpo2 > 0) setKadarOksigen(avgSpo2);
          console.log('Auto-filled vital signs from monitoring:', { avgHr, avgSpo2 });
        }
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!selectedMedication) {
      alert('Pilih obat dulu.');
      return;
    }
    if (!newPrescriptionItem.dosage?.trim() || !newPrescriptionItem.frequency?.trim()) {
      alert('Mohon lengkapi dosis dan frekuensi.');
      return;
    }
    if (!newPrescriptionItem.duration || newPrescriptionItem.duration < 1) {
      alert('Durasi minimal 1 hari.');
      return;
    }
    if (!newPrescriptionItem.quantity || newPrescriptionItem.quantity < 1) {
      alert('Jumlah minimal 1.');
      return;
    }

    setPrescriptionItems((prev) => [
      ...prev,
      {
        ...newPrescriptionItem,
        medication_id: selectedMedication.id,
        medication_name: selectedMedication.name,
      },
    ]);

    setShowMedicationModal(false);
    setSelectedMedication(null);
    setNewPrescriptionItem({
      medication_id: '',
      quantity: 1,
      dosage: '',
      frequency: '',
      duration: 1,
      instructions: '',
    });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = useMemo(() => {
    if (!diagnosis.trim()) return false;
    if (nextStep === 'Laboratorium' && !labTestType) return false;
    return true;
  }, [diagnosis, nextStep, labTestType]);

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      alert('Diagnosis harus diisi');
      return;
    }

    if (nextStep === 'Laboratorium' && !labTestType) {
      alert('Kalau langkah selanjutnya Laboratorium, pilih salah satu: Uji Urin atau Ronsen.');
      return;
    }

    try {
      setSaving(true);
      const finalTreatmentPlan =
        nextStep === 'Laboratorium'
          ? labTestType           
          : nextStep;

      const payload = {
        ID_pertemuan: appointmentId,
        diagnosis,
        symptoms,
        detak_jantung: detakJantung,
        kadar_oksigen: kadarOksigen,
        treatment_plan: finalTreatmentPlan,
        notes,
        status: 'completed',

        obat: prescriptionItems.map((item) => ({
          ID_Obat: item.medication_id,
          Dosis: item.dosage,
          Frekuensi: item.frequency,
          Durasi_hari: Number(item.duration), 
          Qty: Number(item.quantity),
        })),
      };

      let res;
      let result;

      if (existingHasilId) {
        // Update existing Hasil_Pemeriksaan
        res = await fetch('/api/hasil-pemeriksaan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ID_hasil: existingHasilId,
            ...payload
          }),
        });
      } else {
        // Create new Hasil_Pemeriksaan
        res = await fetch('/api/hasil-pemeriksaan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Gagal simpan pemeriksaan');
      result = await res.json();

      // update tabel rekam medis di UI (tanpa reload)
      if (!existingHasilId) {
        setMedicalRecords((prev) => [
          {
            ID_hasil: String(result.ID_hasil),
            diagnosis,
            symptoms,
            treatment_plan: treatmentPlan,
            notes,
            next_step: nextStep,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // reset form
      setDiagnosis('');
      setSymptoms('');
      setTreatmentPlan('');
      setNotes('');
      setNextStep('Rawat Jalan');
      setLabTestType('');
      setPrescriptionItems([]);
      setDetakJantung(0);
      setKadarOksigen(0);
      setExistingHasilId(null);

      alert(existingHasilId ? 'Pemeriksaan berhasil diupdate' : 'Pemeriksaan berhasil disimpan');
      // router.push('/dashboard');
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
              {patient.Umur} tahun / {prettyGender(patient.Jenis_kelamin)}
            </p>
          </div>
          <div>
            <p className="text-sm">Golongan Darah</p>
            <p className="font-semibold">{patient.Golongan_darah || '-'}</p>
          </div>
          <div>
            <p className="text-sm">Telepon</p>
            <p className="font-semibold">{patient.No_telpon || '-'}</p>
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

        <label className="block mb-2 font-semibold">Detak Jantung (bpm)</label>
        <input
          type="number"
          value={detakJantung}
          onChange={(e) => setDetakJantung(parseInt(e.target.value) || 0)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Contoh: 72"
          min="0"
        />

        <label className="block mb-2 font-semibold">Kadar Oksigen (%)</label>
        <input
          type="number"
          value={kadarOksigen}
          onChange={(e) => setKadarOksigen(parseInt(e.target.value) || 0)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Contoh: 98"
          min="0"
          max="100"
        />

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
          onChange={(e) => setNextStep(e.target.value as NextStep)}
          className="w-full border rounded p-2"
        >
          <option>Rawat Jalan</option>
          <option>Rawat Inap</option>
          <option>Laboratorium</option>
        </select>

        {nextStep === 'Laboratorium' && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <p className="font-semibold text-indigo-900">Pilih pemeriksaan laboratorium</p>
            <p className="text-sm text-indigo-800 mt-1">
              Ini akan dibuat sebagai request untuk staff laboratorium.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3',
                  labTestType === 'urin' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="labTestType"
                  value="urin"
                  checked={labTestType === 'urin'}
                  onChange={() => setLabTestType('urin')}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-gray-900">Uji Urin</p>
                  <p className="text-xs text-gray-600">
                    pH, Protein, Glukosa, Ketone (sesuai form staff lab)
                  </p>
                </div>
              </label>

              <label
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3',
                  labTestType === 'ronsen' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="labTestType"
                  value="ronsen"
                  checked={labTestType === 'ronsen'}
                  onChange={() => setLabTestType('ronsen')}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-gray-900">Ronsen</p>
                  <p className="text-xs text-gray-600">
                    Upload gambar + keterangan hasil ronsen
                  </p>
                </div>
              </label>
            </div>

            {!labTestType && (
              <p className="mt-2 text-sm text-red-600">
                * Wajib pilih salah satu test kalau langkah selanjutnya Laboratorium.
              </p>
            )}
          </div>
        )}
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
                    <td className="px-4 py-2 text-sm">{item.duration} hari</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">
                      <button onClick={() => handleRemoveMedication(index)} className="text-red-600 hover:text-red-800">
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
        <Link href="/dashboard" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          Batal
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
        </button>
      </div>

      {/* Medication Modal */}
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
                    const med = medications.find((m) => m.id === e.target.value);
                    setSelectedMedication(med || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Pilih Obat --</option>
                  {medications.map((med) => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frekuensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3x sehari"
                    value={newPrescriptionItem.frequency}
                    onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 flex">Durasi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={newPrescriptionItem.duration}
                      onChange={(e) =>
                        setNewPrescriptionItem({
                          ...newPrescriptionItem,
                          duration: Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Hari</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={newPrescriptionItem.quantity}
                    onChange={(e) =>
                      setNewPrescriptionItem({
                        ...newPrescriptionItem,
                        quantity: Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    duration: 1,
                    instructions: '',
                  });
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button onClick={handleAddMedication} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
