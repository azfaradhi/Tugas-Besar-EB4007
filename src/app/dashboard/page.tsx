import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import RegistrationDashboard from '@/components/dashboards/RegistrationDashboard';
import PharmacyDashboard from '@/components/dashboards/PharmacyDashboard';
import LabDashboard from '@/components/dashboards/LabDashboard';
import CashierDashboard from '@/components/dashboards/CashierDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  let dashboardComponent;

  switch (user.role) {
    case 'patient':
      dashboardComponent = <PatientDashboard user={user} />;
      break;
    case 'doctor':
      dashboardComponent = <DoctorDashboard user={user} />;
      break;
    case 'staff_registration':
      dashboardComponent = <RegistrationDashboard user={user} />;
      break;
    case 'staff_pharmacy':
      dashboardComponent = <PharmacyDashboard user={user} />;
      break;
    case 'staff_lab':
      dashboardComponent = <LabDashboard user={user} />;
      break;
    case 'staff_cashier':
      dashboardComponent = <CashierDashboard user={user} />;
      break;
    default:
      dashboardComponent = (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Role tidak dikenali
          </div>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto">
        {dashboardComponent}
      </div>
    </div>
  );
}
