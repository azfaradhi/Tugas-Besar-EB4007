import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import StaffRegistrationDashboard from '@/components/dashboards/StaffRegistrationDashboard';
import StaffPharmacyDashboard from '@/components/dashboards/StaffPharmacyDashboard';
import StaffLabDashboard from '@/components/dashboards/StaffLabDashboard';
import StaffCashierDashboard from '@/components/dashboards/StaffCashierDashboard';

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
      dashboardComponent = <StaffRegistrationDashboard user={user} />;
      break;
    case 'staff_pharmacy':
      dashboardComponent = <StaffPharmacyDashboard user={user} />;
      break;
    case 'staff_lab':
      dashboardComponent = <StaffLabDashboard user={user} />;
      break;
    case 'staff_cashier':
      dashboardComponent = <StaffCashierDashboard user={user} />;
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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      {dashboardComponent}
    </div>
  );
}
