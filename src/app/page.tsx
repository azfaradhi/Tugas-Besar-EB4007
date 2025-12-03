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
      </div>
    </div>
  );
}
