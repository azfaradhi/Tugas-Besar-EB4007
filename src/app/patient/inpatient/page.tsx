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
  isLunas: number; // 0/1
  nama_pasien?: string;
  NIK?: string;
  sumber?: 'umum' | 'farmasi';
  total?: number; // opsional kalau endpoint umum kasih nominal
};

type BillingFarmasi = {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number | string;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: number; // 0/1
  nama_pasien?: string;
  NIK?: string;
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
    NIK: bf.NIK,
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

      {/* Pembayaran */}
      <div className="border-t pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tagihan & Pembayaran</h2>
          <p className="text-gray-600 text-sm">
            Ringkasan tagihan layanan rawat inap dan farmasi terkait.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Tagihan</p>
            <p className="text-3xl font-bold text-gray-900">{allBillings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Sudah Lunas</p>
            <p className="text-3xl font-bold text-gray-900">{paid.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Belum Lunas</p>
            <p className="text-3xl font-bold text-gray-900">{unpaid.length}</p>
          </div>
        </div>

        {unpaid.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tagihan Belum Lunas</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-800">
                  Anda memiliki {unpaid.length} tagihan yang belum dibayar. Silakan lakukan pembayaran di kasir.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {unpaid.map((b) => (
                <div key={b.ID_billing} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">{b.ID_billing}</span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Belum Lunas</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">{b.sumber || 'umum'}</span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        Metode Pembayaran: <span className="font-bold">{b.Jenis_pembayaran || '-'}</span>
                      </p>
                      {typeof b.total === 'number' && (
                        <p className="text-gray-900 font-medium">Total: Rp {b.total.toLocaleString('id-ID')}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Silakan lakukan pembayaran di kasir dengan membawa nomor tagihan ini.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paid.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Riwayat Pembayaran Lunas</h3>
            <div className="grid gap-4">
              {paid.map((b) => (
                <div key={b.ID_billing} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">{b.ID_billing}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Lunas</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">{b.sumber || 'umum'}</span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        Metode Pembayaran: <span className="font-bold">{b.Jenis_pembayaran || '-'}</span>
                      </p>
                      {b.Lunas_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            Dibayar pada{' '}
                            {new Date(b.Lunas_date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {typeof b.total === 'number' && (
                        <p className="text-sm text-gray-600">Total: Rp {b.total.toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allBillings.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Tagihan</h3>
            <p className="text-gray-600 text-sm">Anda belum memiliki riwayat tagihan atau pembayaran.</p>
          </div>
        )}
      </div>
    </div>
  );
}
