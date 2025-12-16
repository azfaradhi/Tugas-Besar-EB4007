'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ExaminationPageProps {
  appointmentId: string;
}

interface Patient {
  id: number;
  patient_number: string;
  name: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  complaint: string;
  status: string;
}

interface Medication {
  id: number;
  code: string;
  name: string;
  unit: string;
  stock: number;
  price: number;
}

interface PrescriptionItem {
  medication_id: number;
  medication_name?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
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

  useEffect(() => {
    if (!appointmentId) return; 
    fetchData();
  }, [appointmentId]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [wearableData, setWearableData] = useState<any[]>([]);
  
  // Form state
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
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState<PrescriptionItem>({
    medication_id: 0,
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const aptRes = await fetch(`/api/appointments?id=${appointmentId}`);

      if (aptRes.ok) {
        const aptData = await aptRes.json();
        const appointmentObj = aptData.appointments?.[0];

        if (!appointmentObj) {
          console.error("Appointment not found");
          return;
        }

        setAppointment(appointmentObj);

        const patientRes = await fetch(`/api/patients?id=${appointmentObj.patient_id}`);
        if (patientRes.ok) {
          const patientData = await patientRes.json();
          const patientObj = patientData.patients?.[0];
          if (!patientObj) {
            console.error("Patient not found");
            return;
          }
          setPatient(patientObj);

          // nanti fetch wearable data
          // const wearableRes = await fetch(`/api/wearable?patient_id=${aptData.appointment.patient_id}`);
          // if (wearableRes.ok) {
          //   const wearableData = await wearableRes.json();
          //   setWearableData(wearableData.data || []);
          // }
        }
      }
      
      // Fetch medications
      const medRes = await fetch('/api/medications');
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedications(medData.medications || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!selectedMedication || !newPrescriptionItem.dosage || !newPrescriptionItem.frequency) {
      alert('Mohon lengkapi data obat');
      return;
    }

    setPrescriptionItems([
      ...prescriptionItems,
      {
        ...newPrescriptionItem,
        medication_id: selectedMedication.id,
        medication_name: selectedMedication.name
      }
    ]);

    setShowMedicationModal(false);
    setSelectedMedication(null);
    setNewPrescriptionItem({
      medication_id: 0,
      quantity: 1,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis) {
      alert('Diagnosis harus diisi');
      return;
    }

    try {
      setSaving(true);

        // Create medical record
        const medicalRecordRes = await fetch('/api/medical-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: appointmentId,
            patient_id: patient?.id,
            doctor_id: appointment?.doctor_id,
            diagnosis,
            symptoms,
            vital_signs: vitalSigns,
            notes,
            treatment_plan: treatmentPlan,
            status: 'completed'
          })
        });

        if (!medicalRecordRes.ok) {
          alert('Gagal menyimpan rekam medis');
        }

      const medicalRecordData = await medicalRecordRes.json();
      const medicalRecordId = medicalRecordData.medical_record_id;

      console.log("medicalRecordId:", medicalRecordId);
      console.log("patient?.id:", patient?.id);
      console.log("appointment?.doctor_id:", appointment?.doctor_id);
      console.log("prescriptionItems:", prescriptionItems);


      if (prescriptionItems.length > 0) {
        const prescriptionRes = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medical_record_id: medicalRecordId,
            patient_id: patient?.id,
            doctor_id: appointment?.doctor_id,
            items: prescriptionItems,
            status: 'pending'
          })
        });

        if (!prescriptionRes.ok) {
          const errorText = await prescriptionRes.text(); // Capture error response
          console.error('Failed to save prescription:', errorText); // Log error details
          throw new Error('Gagal menyimpan resep');
        }
      }

      // Update appointment status
      await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          status: 'completed'
        })
      });

      alert('Pemeriksaan berhasil disimpan');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving examination:', error);
      alert('Gagal menyimpan pemeriksaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!patient || !appointment) {
    return (
      <div className="p-8">
        <p>Data tidak ditemukan</p>
      </div>
    );
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-6">Pemeriksaan Pasien</h2>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Informasi Pasien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">No. Pasien</p>
            <p className="font-semibold">{patient.patient_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nama</p>
            <p className="font-semibold">{patient.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Usia / Jenis Kelamin</p>
            <p className="font-semibold">
              {calculateAge(patient.date_of_birth)} tahun / {patient.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Golongan Darah</p>
            <p className="font-semibold">{patient.blood_type || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Telepon</p>
            <p className="font-semibold">{patient.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tanggal Kunjungan</p>
            <p className="font-semibold">
              {new Date(appointment.appointment_date).toLocaleDateString('id-ID')} - {appointment.appointment_time}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Keluhan</p>
            <p className="font-semibold">{appointment.complaint || '-'}</p>
          </div>
        </div>
      </div>

      {/* Wearable Data */}
      {/* {wearableData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Wearable Device</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wearableData.slice(0, 4).map((data, index) => (
              <div key={index} className="border rounded-lg p-3">
                <p className="text-xs text-gray-600">{data.measurement_type}</p>
                <p className="text-lg font-bold">{data.value} {data.unit}</p>
                <p className="text-xs text-gray-500">
                  {new Date(data.measured_at).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Vital Signs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tanda-tanda Vital</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tekanan Darah</label>
            <input
              type="text"
              placeholder="120/80 mmHg"
              value={vitalSigns.blood_pressure}
              onChange={(e) => setVitalSigns({...vitalSigns, blood_pressure: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denyut Jantung (bpm)</label>
            <input
              type="text"
              placeholder="72"
              value={vitalSigns.heart_rate}
              onChange={(e) => setVitalSigns({...vitalSigns, heart_rate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suhu Tubuh (°C)</label>
            <input
              type="text"
              placeholder="36.5"
              value={vitalSigns.temperature}
              onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laju Napas (/menit)</label>
            <input
              type="text"
              placeholder="16"
              value={vitalSigns.respiratory_rate}
              onChange={(e) => setVitalSigns({...vitalSigns, respiratory_rate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saturasi Oksigen (%)</label>
            <input
              type="text"
              placeholder="98"
              value={vitalSigns.oxygen_saturation}
              onChange={(e) => setVitalSigns({...vitalSigns, oxygen_saturation: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berat Badan (kg)</label>
            <input
              type="text"
              placeholder="65"
              value={vitalSigns.weight}
              onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Examination Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detail Pemeriksaan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gejala</label>
            <textarea
              rows={3}
              placeholder="Deskripsikan gejala yang dialami pasien..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              placeholder="Masukkan diagnosis..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rencana Perawatan</label>
            <textarea
              rows={3}
              placeholder="Rencana perawatan untuk pasien..."
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Prescription */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Resep Obat</h3>
          <button
            onClick={() => setShowMedicationModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Tambah Obat
          </button>
        </div>

        {prescriptionItems.length === 0 ? (
          <p className="text-gray-500">Belum ada obat yang diresepkan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nama Obat</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dosis</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Frekuensi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Durasi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Jumlah</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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

      {/* Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Tambah Obat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Obat</label>
                <select
                  value={selectedMedication?.id || ''}
                  onChange={(e) => {
                    const med = medications.find(m => m.id === parseInt(e.target.value));
                    setSelectedMedication(med || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Obat --</option>
                  {medications.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} - Stock: {med.stock} {med.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                  <input
                    type="text"
                    placeholder="Contoh: 500mg"
                    value={newPrescriptionItem.dosage}
                    onChange={(e) => setNewPrescriptionItem({...newPrescriptionItem, dosage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frekuensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3x sehari"
                    value={newPrescriptionItem.frequency}
                    onChange={(e) => setNewPrescriptionItem({...newPrescriptionItem, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 7 hari"
                    value={newPrescriptionItem.duration}
                    onChange={(e) => setNewPrescriptionItem({...newPrescriptionItem, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={newPrescriptionItem.quantity}
                    onChange={(e) => setNewPrescriptionItem({...newPrescriptionItem, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instruksi</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Diminum setelah makan"
                  value={newPrescriptionItem.instructions}
                  onChange={(e) => setNewPrescriptionItem({...newPrescriptionItem, instructions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMedicationModal(false);
                  setSelectedMedication(null);
                  setNewPrescriptionItem({
                    medication_id: 0,
                    quantity: 1,
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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