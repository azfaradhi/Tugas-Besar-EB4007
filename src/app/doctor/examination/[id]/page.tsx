'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Patient { ID_pasien: number; Nama: string; NIK: string; Tanggal_lahir: string; Umur: number; Jenis_kelamin: string; No_telpon: string; Alamat: string; Golongan_darah: string; Riwayat_penyakit: string | null; Nama_ibu_kandung: string; }
interface Appointment { ID_pertemuan: number; ID_Pasien: number; ID_Dokter: number; ID_Perawat: number | null; ID_ruangan: number | null; Tanggal: string; Waktu_mulai: string; Waktu_selesai: string | null; patient_name: string; doctor_specialization: string; doctor_name: string; status?: 'scheduled'|'completed'|'cancelled'; }
interface Medication { id: number; name: string; unit: string; price: number; }
interface PrescriptionItem { medication_id: number; medication_name?: string; quantity: number; dosage: string; frequency: string; duration: string; instructions: string; }
interface VitalSigns { blood_pressure: string; heart_rate: string; temperature: string; respiratory_rate: string; oxygen_saturation: string; weight: string; height: string; }

export default function ExaminationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const appointmentId = useMemo(() => Number(params?.id), [params]);
  const isViewMode = searchParams.get('mode') === 'view';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({ blood_pressure:'', heart_rate:'', temperature:'', respiratory_rate:'', oxygen_saturation:'', weight:'', height:'' });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState<'Rawat Jalan'|'Rawat Inap'|'Laboratorium'>('Rawat Jalan');

  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState<PrescriptionItem>({ medication_id:0, quantity:1, dosage:'', frequency:'', duration:'', instructions:'' });

  const [labType, setLabType] = useState<'gula_darah' | 'urin' | ''>('');

  useEffect(() => { if (!appointmentId) return; fetchData(); }, [appointmentId, isViewMode]);

  useEffect(() => { if (nextStep !== 'Laboratorium') setLabType(''); }, [nextStep]);


  const fetchData = async () => {
    try {
      setLoading(true);

      const aptRes = await fetch(`/api/pertemuan?id=${appointmentId}`);
      if (!aptRes.ok) throw new Error('Gagal ambil data pertemuan');
      const aptData = await aptRes.json();
      const appointmentObj: Appointment | undefined = aptData.pertemuans?.[0];
      if (!appointmentObj) throw new Error('Pertemuan tidak ditemukan');
      setAppointment(appointmentObj);

      const patientRes = await fetch(`/api/pasien?id=${appointmentObj.ID_Pasien}`);
      if (!patientRes.ok) throw new Error('Gagal ambil data pasien');
      const patientData = await patientRes.json();
      setPatient(patientData.pasiens?.[0] || null);

      const medRes = await fetch('/api/obat');
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedications((medData.obats || []).map((o: any) => ({ id: Number(o.ID_obat), name: o.Nama, unit: o.Kategori, price: Number(o.Harga_satuan ?? 0) })));
      }

      if (isViewMode) {
        const hasilRes = await fetch(`/api/hasil-pemeriksaan?pertemuanId=${appointmentId}`);
        if (hasilRes.ok) {
          const hasilData = await hasilRes.json();
          const hp = hasilData?.hasil_pemeriksaan?.[0];
          if (hp) {
            setSymptoms(hp.symptoms || '');
            setDiagnosis(hp.diagnosis || '');
            setTreatmentPlan(hp.treatment_plan || '');
            setNotes(hp.notes || '');
            setNextStep((hp.next_step as any) || 'Rawat Jalan');
            try { setVitalSigns(hp.vital_signs ? JSON.parse(hp.vital_signs) : { blood_pressure:'', heart_rate:'', temperature:'', respiratory_rate:'', oxygen_saturation:'', weight:'', height:'' }); } catch { /* ignore */ }
            const obat = (hp.obat || []).map((x: any) => ({ medication_id: Number(x.ID_Obat), medication_name: x.Nama, quantity: Number(x.Qty ?? 1), dosage: x.Dosis ?? '', frequency: x.Frekuensi ?? '', duration: String(x.Durasi_hari ?? ''), instructions: '' }));
            setPrescriptionItems(obat);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (isViewMode) return;
    if (!selectedMedication || !newPrescriptionItem.dosage || !newPrescriptionItem.frequency) return alert('Mohon lengkapi data obat.');
    setPrescriptionItems(prev => [...prev, { ...newPrescriptionItem, medication_id: selectedMedication.id, medication_name: selectedMedication.name }]);
    setShowMedicationModal(false);
    setSelectedMedication(null);
    setNewPrescriptionItem({ medication_id:0, quantity:1, dosage:'', frequency:'', duration:'', instructions:'' });
  };

  const handleRemoveMedication = (index: number) => { if (isViewMode) return; setPrescriptionItems(prev => prev.filter((_, i) => i !== index)); };

  const handleSubmit = async () => {
    if (isViewMode) return;
    if (!appointmentId) {
      alert('ID pertemuan tidak ditemukan');
      return;
    }
    if (!diagnosis.trim()) {
      alert('Diagnosis harus diisi');
      return;
    }
    if (nextStep === 'Laboratorium' && !labType) {
      alert('Pilih jenis pemeriksaan laboratorium (Gula Darah / Urin)');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/hasil-pemeriksaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID_pertemuan: appointmentId, diagnosis, symptoms, vital_signs: vitalSigns, treatment_plan: treatmentPlan, notes, next_step: nextStep, status: 'completed', obat: prescriptionItems.map(item => ({ ID_Obat: item.medication_id, dosage: item.dosage, frequency: item.frequency, duration: item.duration, quantity: item.quantity })) })
      });
      if (!res.ok) throw new Error('Gagal simpan pemeriksaan');
      alert('Pemeriksaan berhasil disimpan');
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan pemeriksaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-900">Loading...</div>;
  if (!patient || !appointment) return <div className="p-8 text-slate-900">Data tidak ditemukan</div>;

  const inputCls = `w-full border rounded p-2 mb-4 text-slate-900 bg-white ${isViewMode ? 'opacity-90' : ''}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6"><Link href={isViewMode ? "/doctor/pertemuan" : "/dashboard"} className="text-blue-600 hover:underline">← Kembali</Link></div>
        <h2 className="text-3xl font-bold mb-6">{isViewMode ? 'Hasil Pemeriksaan' : 'Pemeriksaan Pasien'}</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Informasi Pasien</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-slate-600">No. Pasien</p><p className="font-semibold">{patient.ID_pasien}</p></div>
            <div><p className="text-sm text-slate-600">Nama</p><p className="font-semibold">{patient.Nama}</p></div>
            <div><p className="text-sm text-slate-600">Usia / Jenis Kelamin</p><p className="font-semibold">{patient.Umur} tahun / {patient.Jenis_kelamin === 'male' ? 'Laki-laki' : 'Perempuan'}</p></div>
            <div><p className="text-sm text-slate-600">Golongan Darah</p><p className="font-semibold">{patient.Golongan_darah || '-'}</p></div>
            <div><p className="text-sm text-slate-600">Telepon</p><p className="font-semibold">{patient.No_telpon}</p></div>
            <div><p className="text-sm text-slate-600">Tanggal Kunjungan</p><p className="font-semibold">{new Date(appointment.Tanggal).toLocaleDateString('id-ID')} — {appointment.Waktu_mulai}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Detail Pemeriksaan</h3>
          <label className="block mb-2 font-semibold">Gejala</label>
          <textarea rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className={inputCls} disabled={isViewMode} />
          <label className="block mb-2 font-semibold">Diagnosis</label>
          <textarea rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className={inputCls} disabled={isViewMode} />
          <label className="block mb-2 font-semibold">Rencana Perawatan</label>
          <textarea rows={2} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} className={inputCls} disabled={isViewMode} />
          <label className="block mb-2 font-semibold">Catatan Tambahan</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} disabled={isViewMode} />
          <label className="block mb-2 font-semibold">Langkah Selanjutnya</label>
          <select value={nextStep} onChange={(e) => setNextStep(e.target.value as any)} className={inputCls} disabled={isViewMode}>
            <option>Rawat Jalan</option>
            <option>Rawat Inap</option>
            <option>Laboratorium</option>
          </select>
          {nextStep === 'Laboratorium' && (
            <div className="mt-4">
              <label className="block mb-2 font-semibold">Jenis Laboratorium</label>
              <select value={labType} onChange={(e) => setLabType(e.target.value as any)} className="w-full border rounded p-2">
                <option value="">-- Pilih Pemeriksaan --</option>
                <option value="gula_darah">Gula Darah</option>
                <option value="urin">Urin</option>
              </select>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Resep Obat</h3>
            {!isViewMode && <button onClick={() => setShowMedicationModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Tambah Obat</button>}
          </div>
          {prescriptionItems.length === 0 ? (
            <p className="text-slate-600">Tidak ada obat yang diresepkan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr className="bg-slate-100">
                  <th className="px-4 py-2 text-left text-sm font-medium">Nama Obat</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Dosis</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Frekuensi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Durasi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Jumlah</th>
                  {!isViewMode && <th className="px-4 py-2 text-left text-sm font-medium">Aksi</th>}
                </tr></thead>
                <tbody className="divide-y">
                  {prescriptionItems.map((item, idx) => (
                    <tr key={`${item.medication_id}-${idx}`}>
                      <td className="px-4 py-2 text-sm">{item.medication_name}</td>
                      <td className="px-4 py-2 text-sm">{item.dosage}</td>
                      <td className="px-4 py-2 text-sm">{item.frequency}</td>
                      <td className="px-4 py-2 text-sm">{item.duration}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      {!isViewMode && <td className="px-4 py-2 text-sm"><button onClick={() => handleRemoveMedication(idx)} className="text-red-600 hover:text-red-800">Hapus</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isViewMode && (
          <div className="flex justify-end space-x-4">
            <Link href="/doctor/examination" className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100">Batal</Link>
            <button onClick={handleSubmit} disabled={saving || !diagnosis} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{saving ? 'Menyimpan...' : 'Simpan Pemeriksaan'}</button>
          </div>
        )}

        {!isViewMode && showMedicationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Tambah Obat</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pilih Obat</label>
                  <select value={selectedMedication?.id || ''} onChange={(e) => setSelectedMedication(medications.find(m => m.id === Number(e.target.value)) || null)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Pilih Obat --</option>
                    {medications.map(med => <option key={med.id} value={med.id}>{med.name}{med.unit ? ` (${med.unit})` : ''}{med.price ? ` - Rp${med.price}` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Dosis</label><input type="text" value={newPrescriptionItem.dosage} onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, dosage: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Frekuensi</label><input type="text" value={newPrescriptionItem.frequency} onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, frequency: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Durasi</label><input type="text" value={newPrescriptionItem.duration} onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, duration: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Jumlah</label><input type="number" min={1} value={newPrescriptionItem.quantity} onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, quantity: Number(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Instruksi</label><textarea rows={2} value={newPrescriptionItem.instructions} onChange={(e) => setNewPrescriptionItem({ ...newPrescriptionItem, instructions: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => { setShowMedicationModal(false); setSelectedMedication(null); setNewPrescriptionItem({ medication_id:0, quantity:1, dosage:'', frequency:'', duration:'', instructions:'' }); }} className="px-4 py-2 border rounded-lg">Batal</button>
                <button onClick={handleAddMedication} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Tambah</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
