import DashboardLayout from '@/components/DashboardLayout';

export default function VisitRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
