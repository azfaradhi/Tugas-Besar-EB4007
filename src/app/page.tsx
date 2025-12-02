import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Sistem Informasi Kesehatan
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          EB4007 - Tugas Besar
        </p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg"
        >
          Masuk ke Sistem
        </Link>

        <div className="mt-12 text-left max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Fitur Aplikasi:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Sistem Login Multi-Role</li>
            <li>✓ Pendaftaran Pasien</li>
            <li>✓ Pemeriksaan Dokter & Rekam Medis</li>
            <li>✓ Resep & Manajemen Farmasi</li>
            <li>✓ Laboratorium & Hasil Tes</li>
            <li>✓ Pembayaran & Kasir</li>
            <li>✓ Monitoring Wearable Device</li>
            <li>✓ Sistem Rujukan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
