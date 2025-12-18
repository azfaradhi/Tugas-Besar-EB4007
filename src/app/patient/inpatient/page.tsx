'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type InpatientItem = {
  ID_pertemuan: string;
  tanggal: string;         // 'YYYY-MM-DD'
  waktu_mulai: string;     // 'HH:MM:SS'
  waktu_selesai: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  ruangan: {
    id: string | null;     // ID_ruangan
    lantai: number | null;
    gedung_nama: string | null;
  };
  dokter_nama: string;
  perawat_nama: string | null;
};

type Billing = {
  ID_billing: string;
  ID_pasien: string;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: number;
  nama_pasien?: string;
  sumber?: 'umum' | 'farmasi';
  total?: number;
};

type BillingFarmasi = {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number | string;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: number;
  nama_pasien?: string;
};

export default function InpatientPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState<InpatientItem[]>([]);
  const [billingUmum, setBillingUmum] = useState<Billing[]>([]);
  const [billingFarmasi, setBillingFarmasi] = useState<BillingFarmasi[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        setLoading(false);
        return;
      }
      const meJson = await meRes.json();
      setUser(meJson.user);

      const patientId = meJson.user?.profileId;
      if (!patientId) {
        setLoading(false);
        return;
      }

      const [inpatientRes, billingRes, billingFarmasiRes] = await Promise.all([
        fetch(`/api/inpatient?patientId=${patientId}`),
        fetch(`/api/billing?patientId=${patientId}`),
        fetch(`/api/billing-farmasi?patientId=${patientId}`)
      ]);

      if (inpatientRes.ok) {
        const data = await inpatientRes.json();
        setSchedules(data.schedules || []);
      }
      if (billingRes.ok) {
        const data = await billingRes.json();
        const rows: Billing[] = (data.billings || []).map((b: Billing) => ({ ...b, sumber: 'umum' }));
        setBillingUmum(rows);
      }
      if (billingFarmasiRes.ok) {
        const data = await billingFarmasiRes.json();
        setBillingFarmasi(data.billings || []);
      }
    } catch (e) {
      console.error('Error loading inpatient page:', e);
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => new Date(), []);
  const toDate = (d: string) => new Date(d + 'T00:00:00');

  const upcoming = schedules
    .filter(s => s.status === 'scheduled' && toDate(s.tanggal) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => (a.tanggal + a.waktu_mulai).localeCompare(b.tanggal + b.waktu_mulai));

  const history = schedules
    .filter(s => s.status !== 'scheduled' || toDate(s.tanggal) < new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => (b.tanggal + (b.waktu_mulai || '')).localeCompare(a.tanggal + (a.waktu_mulai || '')));

  // Normalisasi billing untuk ditampilkan gabungan (umum + farmasi)
  const normalizedFarmasi: Billing[] = billingFarmasi.map(bf => ({
    ID_billing: bf.ID_billing_farmasi,
    ID_pasien: bf.ID_pasien,
    Lunas_date: bf.Lunas_date,
    Jenis_pembayaran: bf.Jenis_pembayaran,
    isLunas: bf.isLunas,
    nama_pasien: bf.nama_pasien,
    sumber: 'farmasi',
    total: typeof bf.Total_harga === 'string' ? Number(bf.Total_harga) : bf.Total_harga
  }));

  const allBillings: Billing[] = [...billingUmum, ...normalizedFarmasi];
  const unpaid = allBillings.filter(b => Number(b.isLunas) === 0);
  const paid = allBillings.filter(b => Number(b.isLunas) === 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rawat Inap</h1>
        <p className="text-gray-600">Jadwal rawat inap Anda, beserta tagihan dan status pembayarannya.</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total Jadwal</p>
          <p className="text-3xl font-bold text-gray-900">{schedules.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <p className="text-sm text-gray-600 mb-1">Jadwal Mendatang</p>
          <p className="text-3xl font-bold text-gray-900">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Tagihan Lunas</p>
          <p className="text-3xl font-bold text-gray-900">{paid.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Tagihan Belum Lunas</p>
          <p className="text-3xl font-bold text-gray-900">{unpaid.length}</p>
        </div>
      </div>

      {/* Jadwal Mendatang */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Jadwal Rawat Inap Mendatang</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
            Tidak ada jadwal mendatang.
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map(item => (
              <div key={item.ID_pertemuan} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        Scheduled
                      </span>
                      <span className="text-sm font-semibold text-gray-500">
                        {item.ID_pertemuan}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-900 font-medium">
                      Tanggal:{" "}
                      {new Date(item.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}{" "}
                      • Jam: {item.waktu_mulai?.slice(0,5)}
                    </p>
                    <p className="text-sm text-gray-700">
                      Dokter: <span className="font-semibold">{item.dokter_nama}</span>
                      {item.perawat_nama ? <> • Perawat: <span className="font-semibold">{item.perawat_nama}</span></> : null}
                    </p>
                    <p className="text-sm text-gray-700">
                      Ruangan: <span className="font-semibold">{item.ruangan?.id || '-'}</span>
                      {typeof item.ruangan?.lantai === 'number' ? <> • Lantai {item.ruangan.lantai}</> : null}
                      {item.ruangan?.gedung_nama ? <> • {item.ruangan.gedung_nama}</> : null}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Rawat Inap</h2>
        {history.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
            Belum ada riwayat rawat inap.
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map(item => (
              <div key={item.ID_pertemuan} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-400">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {item.status === 'completed' ? 'Selesai' : item.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-500">
                        {item.ID_pertemuan}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-900 font-medium">
                      Tanggal:{" "}
                      {new Date(item.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}{" "}
                      • Jam: {item.waktu_mulai?.slice(0,5)}
                    </p>
                    <p className="text-sm text-gray-700">
                      Dokter: <span className="font-semibold">{item.dokter_nama}</span>
                      {item.perawat_nama ? <> • Perawat: <span className="font-semibold">{item.perawat_nama}</span></> : null}
                    </p>
                    <p className="text-sm text-gray-700">
                      Ruangan: <span className="font-semibold">{item.ruangan?.id || '-'}</span>
                      {typeof item.ruangan?.lantai === 'number' ? <> • Lantai {item.ruangan.lantai}</> : null}
                      {item.ruangan?.gedung_nama ? <> • {item.ruangan.gedung_nama}</> : null}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
