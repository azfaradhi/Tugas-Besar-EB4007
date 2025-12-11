'use client';

import { useEffect, useState } from 'react';

interface Sale {
  ID_billing_farmasi: string;
  ID_hasil: string;
  ID_pasien: string;
  Total_harga: number;
  Lunas_date: string | null;
  Jenis_pembayaran: string | null;
  isLunas: boolean;
  nama_pasien: string;
  tanggal_pertemuan: string;
  dokter: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/hasil-pemeriksaan');
      if (response.ok) {
        const data = await response.json();

        const salesData: Sale[] = [];
        for (const hasil of data.hasil_pemeriksaan || []) {
          if (hasil.obat && hasil.obat.length > 0) {
            const totalHarga = hasil.obat.reduce(
              (sum: number, obat: any) => sum + (obat.Subtotal || 0),
              0
            );

            const billingResponse = await fetch(`/api/billing-pharmacy?patientId=${hasil.ID_Pasien}`);
            let billing = null;
            if (billingResponse.ok) {
              const billingData = await billingResponse.json();
              billing = (billingData.billings || []).find(
                (b: any) => b.ID_hasil === hasil.ID_hasil
              );
            }

            salesData.push({
              ID_billing_farmasi: billing?.ID_billing_farmasi || '',
              ID_hasil: hasil.ID_hasil,
              ID_pasien: hasil.ID_Pasien,
              Total_harga: billing?.Total_harga || totalHarga,
              Lunas_date: billing?.Lunas_date || null,
              Jenis_pembayaran: billing?.Jenis_pembayaran || null,
              isLunas: billing?.isLunas || false,
              nama_pasien: hasil.nama_pasien,
              tanggal_pertemuan: hasil.tanggal_pertemuan,
              dokter: hasil.nama_dokter,
            });
          }
        }

        setSales(salesData);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (sale: Sale) => {
    if (dateFilter === 'all') return true;

    const saleDate = new Date(sale.tanggal_pertemuan);
    const now = new Date();

    switch (dateFilter) {
      case 'today':
        return saleDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && sale.isLunas) ||
      (filter === 'unpaid' && !sale.isLunas);

    const matchesDate = filterByDate(sale);

    const matchesSearch =
      !searchTerm ||
      sale.nama_pasien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.ID_billing_farmasi?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesDate && matchesSearch;
  });

  const totalRevenue = filteredSales
    .filter((s) => s.isLunas)
    .reduce((sum, sale) => sum + sale.Total_harga, 0);

  const totalPending = filteredSales
    .filter((s) => !s.isLunas)
    .reduce((sum, sale) => sum + sale.Total_harga, 0);

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Riwayat Penjualan</h1>
        <p className="text-gray-600">Laporan transaksi penjualan obat</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Transaksi</h3>
          <p className="text-3xl font-bold text-indigo-600">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pendapatan</h3>
          <p className="text-2xl font-bold text-green-600">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500 mt-1">Lunas</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending</h3>
          <p className="text-2xl font-bold text-orange-600">
            Rp {totalPending.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500 mt-1">Belum lunas</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rata-rata</h3>
          <p className="text-2xl font-bold text-purple-600">
            Rp{' '}
            {filteredSales.length > 0
              ? Math.round(
                  filteredSales.reduce((sum, s) => sum + s.Total_harga, 0) / filteredSales.length
                ).toLocaleString('id-ID')
              : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per transaksi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari pasien atau nomor billing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium ${
                dateFilter === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              30 Hari
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'unpaid'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Belum Lunas
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokter
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data penjualan
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.ID_billing_farmasi || sale.ID_hasil} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.ID_billing_farmasi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(sale.tanggal_pertemuan).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.nama_pasien}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.dokter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Rp {sale.Total_harga.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.Jenis_pembayaran || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {sale.isLunas ? (
                        <span className="px-3 py-1 inline-block bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Lunas
                        </span>
                      ) : sale.ID_billing_farmasi ? (
                        <span className="px-3 py-1 inline-block bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Belum Bayar
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-block bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          Belum Diproses
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                  Total:
                </td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                  Rp{' '}
                  {filteredSales
                    .reduce((sum, sale) => sum + sale.Total_harga, 0)
                    .toLocaleString('id-ID')}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
