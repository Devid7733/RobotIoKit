import AdminHeader from "@/components/admin/AdminHeader";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Orders | RobotIoKit",
  description: "Manage customer orders, payment state, and fulfillment."
};

export default async function AdminOrdersPage() {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Orders" primaryLabel="Dashboard" primaryHref="/admin" />}
    >
      <AdminOrdersClient />
    </AdminShell>
  );
}
