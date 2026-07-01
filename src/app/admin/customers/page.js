import AdminCustomersClient from "@/components/admin/AdminCustomersClient";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Customers | RobotIoKit"
};

export default async function AdminCustomersPage() {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Customers" />}
    >
      <AdminCustomersClient />
    </AdminShell>
  );
}
