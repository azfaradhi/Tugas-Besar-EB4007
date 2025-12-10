import DashboardLayout from '@/components/DashboardLayout';

export default function MedicalRecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
