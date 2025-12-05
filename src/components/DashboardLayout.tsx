import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
