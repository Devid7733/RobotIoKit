import AdminHeader from "@/components/admin/AdminHeader";
import AdminRobotKitManager from "@/components/admin/AdminRobotKitManager";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";
import { listAdminRobotKits } from "@/services/robotKitService";

export const metadata = {
  title: "Admin Robot Kits | RobotIoKit"
};

export default async function AdminRobotKitsPage() {
  await requireAdminSession();
  const robotKits = await listAdminRobotKits();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Robot Kits" primaryLabel="Dashboard" primaryHref="/admin" />}
    >
      <AdminRobotKitManager initialRobotKits={robotKits} />
    </AdminShell>
  );
}
