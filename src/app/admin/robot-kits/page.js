import AdminHeader from "@/components/admin/AdminHeader";
import AdminRobotKitManager from "@/components/admin/AdminRobotKitManager";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Robot Kits | RobotIoKit"
};

export default async function AdminRobotKitsPage() {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Robot Kits" primaryLabel="Dashboard" primaryHref="/admin" />}
    >
      <AdminRobotKitManager />
    </AdminShell>
  );
}
