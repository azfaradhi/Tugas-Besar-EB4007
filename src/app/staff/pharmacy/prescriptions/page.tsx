'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Prescription {
  ID_hasil: string;
  pertemuanId: string;
  tanggal: string;
  waktu_mulai: string;
  dokter: string;
  diagnosis: string;
  status: string;
  medications: Array<{
    ID_obat: string;
    nama_obat: string;
    kategori: string;
    dosis: string;
    frekuensi: string;
    durasi_hari: number;
    qty: number;
    harga_satuan: number;
    subtotal: number;
  }>;
  billing: {
    ID_billing_farmasi: string;
    Total_harga: number;
    isLunas: boolean;
  } | null;
  pasien_nama: string;
  pasien_id: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/hasil-pemeriksaan');
      if (response.ok) {
        const data = await response.json();
        // Filter only prescriptions with medications and add patient info
        const withMeds = (data.hasil_pemeriksaan || []).filter(
          (h: any) => h.obat && h.obat.length > 0
        );

        // Fetch billing info for each prescription
        const prescriptionsWithBilling = await Promise.all(
          withMeds.map(async (prescription: any) => {
            try {
              const billingResponse = await fetch(`/api/billing-pharmacy?patientId=${prescription.ID_Pasien}`);
              let billing = null;
              if (billingResponse.ok) {
                const billingData = await billingResponse.json();
                billing = (billingData.billings || []).find(
                  (b: any) => b.ID_hasil === prescription.ID_hasil
                );
              }

              return {
                ...prescription,
                pasien_nama: prescription.nama_pasien,
                pasien_id: prescription.ID_Pasien,
                dokter: prescription.nama_dokter,
                tanggal: prescription.tanggal_pertemuan,
                billing: billing ? {
                  ID_billing_farmasi: billing.ID_billing_farmasi,
                  Total_harga: billing.Total_harga,
                  isLunas: billing.isLunas,
                } : null,
              };
            } catch (error) {
              console.error('Error fetching billing for prescription:', error);
              return {
                ...prescription,
                pasien_nama: prescription.nama_pasien,
                pasien_id: prescription.ID_Pasien,
                dokter: prescription.nama_dokter,
                tanggal: prescription.tanggal_pertemuan,
                billing: null,
              };
            }
          })
        );

        setPrescriptions(prescriptionsWithBilling);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPrescription = async (prescription: Prescription) => {
    setProcessingId(prescription.ID_hasil);
    try {
      // Calculate total price
      const totalPrice = prescription.medications.reduce(
        (sum, med) => sum + (med.subtotal || 0),
        0
      );

      // Create billing record
      const billingResponse = await fetch('/api/billing-pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_hasil: prescription.ID_hasil,
          ID_pasien: prescription.pasien_id,
          Total_harga: totalPrice,
        }),
      });

      if (billingResponse.ok) {
        alert('Resep berhasil diproses!');
        fetchPrescriptions();
      } else {
        alert('Gagal memproses resep');
      }
    } catch (error) {
      console.error('Error processing prescription:', error);
      alert('Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unpaid' && !p.billing?.isLunas) ||
      (filter === 'paid' && p.billing?.isLunas);

    const matchesSearch =
      !searchTerm ||
      p.pasien_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ID_hasil.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-8">
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resep Masuk</h1>
        <p className="text-gray-600">Kelola resep obat dari dokter</p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari pasien atau nomor resep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'unpaid'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Belum Bayar
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sudah Bayar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Resep</h3>
          <p className="text-3xl font-bold text-indigo-600">{prescriptions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Belum Bayar</h3>
          <p className="text-3xl font-bold text-orange-600">
            {prescriptions.filter((p) => !p.billing?.isLunas).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Sudah Bayar</h3>
          <p className="text-3xl font-bold text-green-600">
            {prescriptions.filter((p) => p.billing?.isLunas).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Nilai</h3>
          <p className="text-2xl font-bold text-gray-800">
            Rp{' '}
            {prescriptions
              .reduce((sum, p) => sum + (p.billing?.Total_harga || 0), 0)
              .toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Tidak ada resep ditemukan</p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div key={prescription.ID_hasil} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Resep #{prescription.ID_hasil}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Pasien: {prescription.pasien_nama || 'N/A'}</p>
                      <p>Dokter: {prescription.dokter}</p>
                      <p>
                        Tanggal: {new Date(prescription.tanggal).toLocaleDateString('id-ID')} {prescription.waktu_mulai}
                      </p>
                      {prescription.diagnosis && <p>Diagnosis: {prescription.diagnosis}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    {prescription.billing?.isLunas ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Lunas
                      </span>
                    ) : prescription.billing ? (
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Belum Bayar
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        Belum Diproses
                      </span>
                    )}
                  </div>
                </div>

                {/* Medications Table */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Daftar Obat:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Obat
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Dosis
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Frekuensi
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Durasi
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Harga
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prescription.medications.map((med, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium text-gray-900">{med.nama_obat}</p>
                                <p className="text-gray-500 text-xs">{med.kategori}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{med.dosis || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{med.frekuensi || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {med.durasi_hari ? `${med.durasi_hari} hari` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">{med.qty || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              Rp {(med.harga_satuan || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              Rp {(med.subtotal || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            Rp{' '}
                            {prescription.medications
                              .reduce((sum, med) => sum + (med.subtotal || 0), 0)
                              .toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                {!prescription.billing && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleProcessPrescription(prescription)}
                      disabled={processingId === prescription.ID_hasil}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {processingId === prescription.ID_hasil ? 'Memproses...' : 'Proses Resep'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
