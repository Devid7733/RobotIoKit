import AdminHeader from "@/components/admin/AdminHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";
import AdminNotificationsClient from "@/app/admin/notifications/_components/AdminNotificationsClient";

export const metadata = {
  title: "Admin Notifications | RobotIoKit",
  description: "Review admin notifications for orders and payment proof submissions."
};

export default async function AdminNotificationsPage() {
  await requireAdminSession();

  return (
    <AdminShell sidebar={<AdminSidebar />} header={<AdminHeader title="Notifications" />}>
      <AdminNotificationsClient />
    </AdminShell>
  );
}
