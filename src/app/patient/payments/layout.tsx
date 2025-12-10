import DashboardLayout from '@/components/DashboardLayout';

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
