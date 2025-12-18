import DashboardLayout from '@/components/DashboardLayout';
import UserManagementClient from '@/components/staff/UserManagementClient';

export default async function UsersManagementPage() {
  return (
    <DashboardLayout>
      <UserManagementClient />
    </DashboardLayout>
  );
}
