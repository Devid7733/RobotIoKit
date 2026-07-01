import AdminHeader from "@/components/admin/AdminHeader";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Dashboard | RobotIoKit",
  description: "Starter admin dashboard scaffold for RobotIoKit."
};

export default async function AdminPage() {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Dashboard" primaryLabel="Manage Orders" primaryHref="/admin/orders" />}
    >
      <AdminDashboardClient />
    </AdminShell>
  );
}
