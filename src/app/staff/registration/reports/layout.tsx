import DashboardLayout from '@/components/DashboardLayout';

export default function ExaminationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
