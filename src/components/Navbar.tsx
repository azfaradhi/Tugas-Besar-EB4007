'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: {
    username: string;
    role: string;
    profileName?: string;
  };
}

const roleLabels: { [key: string]: string } = {
  patient: 'Pasien',
  staff_registration: 'Staf Pendaftaran',
  doctor: 'Dokter',
  staff_pharmacy: 'Staf Farmasi',
  staff_lab: 'Staf Laboratorium',
  staff_cashier: 'Kasir',
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Sistem Informasi Kesehatan</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-semibold">{user.profileName || user.username}</p>
              <p className="text-indigo-200 text-xs">{roleLabels[user.role] || user.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
