import AdminHeader from "@/components/admin/AdminHeader";
import AdminSettingsClient from "@/app/admin/settings/_components/AdminSettingsClient";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Settings | RobotIoKit"
};

export default async function AdminSettingsPage() {
  await requireAdminSession();

  return (
    <AdminShell sidebar={<AdminSidebar />} header={<AdminHeader title="Settings" />}>
      <AdminSettingsClient />
    </AdminShell>
  );
}
