'use client';

import { useEffect, useMemo, useState } from 'react';

type PaymentMethod = 'Cash' | 'Debit' | 'Credit';
type FilterStatus = 'all' | 'lunas' | 'belum';
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

interface Billing {
  ID_billing: string;
  ID_pasien: string;
  ID_pertemuan: string | null;
  Total_harga: number;
  Lunas_date: string | null;
  Jenis_pembayaran: PaymentMethod | null;
  isLunas: number; // 0/1
  patient_name: string;
  patient_number: string;
  phone: string;
}

function rupiah(n: number) {
  return `Rp ${(Number(n) || 0).toLocaleString('id-ID')}`;
}

function isPaid(b: Billing) {
  return b.isLunas === 1;
}

export default function CashierPaymentsPage() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);

  // filter/search/sort
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // date filter (opsional)
  const [dateFrom, setDateFrom] = useState(''); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('');     // yyyy-mm-dd

  // detail modal
  const [selected, setSelected] = useState<Billing | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal fetch /api/billing');
      const data = await res.json();
      setBillings((data.billings || []) as Billing[]);
    } catch (e) {
      console.error(e);
      setBillings([]);
    } finally {
      setLoading(false);
    }
  };

  const normalized = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const inDateRange = (b: Billing) => {
      if (!dateFrom && !dateTo) return true;
      const d = b.Lunas_date ? new Date(b.Lunas_date) : null;
      // kalau filter tanggal diisi: gunakan Lunas_date kalau sudah lunas, kalau belum lunas: exclude
      if (!d) return false;

      const fromOk = !dateFrom || d >= new Date(`${dateFrom}T00:00:00`);
      const toOk = !dateTo || d <= new Date(`${dateTo}T23:59:59`);
      return fromOk && toOk;
    };

    let rows = billings.filter((b) => {
      // status
      if (filterStatus === 'lunas' && !isPaid(b)) return false;
      if (filterStatus === 'belum' && isPaid(b)) return false;

      // method
      if (methodFilter !== 'all') {
        if ((b.Jenis_pembayaran || null) !== methodFilter) return false;
      }

      // search
      if (q) {
        const hay = [
          b.ID_billing,
          b.patient_name,
          b.patient_number,
          b.ID_pasien,
          b.ID_pertemuan ?? '',
          b.phone ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // date range (opsional)
      if ((dateFrom || dateTo) && !inDateRange(b)) return false;

      return true;
    });

    // sort
    rows = rows.sort((a, b) => {
      const aDate = new Date(a.Lunas_date || a.ID_billing).getTime(); // fallback
      const bDate = new Date(b.Lunas_date || b.ID_billing).getTime();

      if (sort === 'newest') return bDate - aDate;
      if (sort === 'oldest') return aDate - bDate;
      if (sort === 'highest') return (b.Total_harga || 0) - (a.Total_harga || 0);
      if (sort === 'lowest') return (a.Total_harga || 0) - (b.Total_harga || 0);
      return 0;
    });

    return rows;
  }, [billings, filterStatus, methodFilter, searchTerm, sort, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = normalized.length;
    const lunas = normalized.filter(isPaid).length;
    const belum = normalized.filter((b) => !isPaid(b)).length;

    const totalValue = normalized.reduce((s, b) => s + (b.Total_harga || 0), 0);
    const paidValue = normalized.filter(isPaid).reduce((s, b) => s + (b.Total_harga || 0), 0);
    const unpaidValue = totalValue - paidValue;

    return { total, lunas, belum, totalValue, paidValue, unpaidValue };
  }, [normalized]);

  const openDetail = (b: Billing) => {
    setSelected(b);
    setShowDetail(true);
  };

  const openPayModal = (b: Billing) => {
    setSelected(b);
    setPaymentMethod('Cash');
    setShowPayModal(true);
  };

  const validateConfirmPaid = () => {
    if (!selected) return 'Tidak ada billing yang dipilih.';
    if (selected.isLunas === 1) return 'Billing ini sudah lunas.';
    if (!selected.Total_harga || selected.Total_harga <= 0) return 'Total harga tidak valid.';
    if (!['Cash', 'Debit', 'Credit'].includes(paymentMethod)) return 'Metode pembayaran tidak valid.';
    return null;
  };

  const handleConfirmPaid = async () => {
    const err = validateConfirmPaid();
    if (err) return alert(err);
    if (!selected) return;

    setSaving(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_billing: selected.ID_billing,
          isLunas: true,
          Jenis_pembayaran: paymentMethod,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Gagal mengkonfirmasi pembayaran');
        return;
      }

      // update state tanpa reload
      setBillings((prev) =>
        prev.map((b) =>
          b.ID_billing === selected.ID_billing
            ? {
                ...b,
                isLunas: 1,
                Jenis_pembayaran: paymentMethod,
                Lunas_date: data?.Lunas_date ?? new Date().toISOString(),
              }
            : b
        )
      );

      alert('Pembayaran berhasil dikonfirmasi (LUNAS).');
      setShowPayModal(false);
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // OPTIONAL: Undo lunas (kalau kamu mau allow)
  const handleUndoPaid = async () => {
    if (!selected) return;
    if (selected.isLunas !== 1) return alert('Billing ini belum lunas.');

    const ok = confirm('Batalkan status LUNAS untuk billing ini?');
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_billing: selected.ID_billing,
          isLunas: false,
          Jenis_pembayaran: null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Gagal membatalkan lunas');
        return;
      }

      setBillings((prev) =>
        prev.map((b) =>
          b.ID_billing === selected.ID_billing
            ? { ...b, isLunas: 0, Jenis_pembayaran: null, Lunas_date: null }
            : b
        )
      );

      alert('Status LUNAS dibatalkan.');
      setShowDetail(false);
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">Kelola pembayaran tagihan pasien (detail + validasi)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Belum Lunas</p>
          <p className="text-3xl font-bold text-red-600">{stats.belum}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Lunas</p>
          <p className="text-3xl font-bold text-green-600">{stats.lunas}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Nilai</p>
          <p className="text-xl font-bold text-gray-900">{rupiah(stats.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Nilai Lunas</p>
          <p className="text-xl font-bold text-gray-900">{rupiah(stats.paidValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari: ID billing, pasien, ID pasien, telp..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Semua</option>
            <option value="belum">Belum Lunas</option>
            <option value="lunas">Lunas</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Semua Metode</option>
            <option value="Cash">Cash</option>
            <option value="Debit">Debit</option>
            <option value="Credit">Credit</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Total Tertinggi</option>
            <option value="lowest">Total Terendah</option>
          </select>
        </div>

        {/* Optional: filter tanggal lunas */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tanggal Lunas Dari</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tanggal Lunas Sampai</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Reset Tanggal
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID Billing</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pasien</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Metode</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Lunas</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {normalized.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                normalized.map((b) => (
                  <tr key={b.ID_billing} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{b.ID_billing}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{b.patient_name}</p>
                        <p className="text-xs text-gray-500">
                          {b.patient_number} • {b.phone || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{rupiah(b.Total_harga)}</td>
                    <td className="py-3 px-4 text-sm">
                      {b.Jenis_pembayaran ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {b.Jenis_pembayaran}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isPaid(b) ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Lunas
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {b.Lunas_date ? new Date(b.Lunas_date).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => openDetail(b)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                      >
                        Detail
                      </button>
                      {!isPaid(b) && (
                        <button
                          onClick={() => openPayModal(b)}
                          className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm"
                        >
                          Konfirmasi Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold">Detail Billing</h3>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelected(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Billing</span>
                <span className="font-medium">{selected.ID_billing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pasien</span>
                <span className="font-medium">{selected.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Pasien</span>
                <span className="font-medium">{selected.patient_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telepon</span>
                <span className="font-medium">{selected.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID Pertemuan</span>
                <span className="font-medium">{selected.ID_pertemuan || '-'}</span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-semibold">Total</span>
                <span className="font-bold text-indigo-600">{rupiah(selected.Total_harga)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium">{isPaid(selected) ? 'Lunas' : 'Belum lunas'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Metode</span>
                <span className="font-medium">{selected.Jenis_pembayaran || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal Lunas</span>
                <span className="font-medium">
                  {selected.Lunas_date ? new Date(selected.Lunas_date).toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {!isPaid(selected) ? (
                <button
                  onClick={() => {
                    setShowDetail(false);
                    openPayModal(selected);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Konfirmasi Bayar
                </button>
              ) : (
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Print
                </button>
              )}

              {/* OPTIONAL */}
              {isPaid(selected) && (
                <button
                  onClick={handleUndoPaid}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {saving ? '...' : 'Batalkan Lunas'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Pembayaran</h3>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Billing</span>
                <span className="font-medium text-gray-900">{selected.ID_billing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pasien</span>
                <span className="font-medium text-gray-900">{selected.patient_name}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600 font-semibold">Total</span>
                <span className="font-bold text-gray-900">{rupiah(selected.Total_harga)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Cash">Cash</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">Pastikan pembayaran telah diterima sebelum mengkonfirmasi.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelected(null);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPaid}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {saving ? 'Memproses...' : 'Konfirmasi Lunas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
