import AdminAnalyticsClient from "@/components/admin/AdminAnalyticsClient";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Analytics | RobotIoKit"
};

export default async function AdminAnalyticsPage() {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Analytics" primaryLabel="Manage Orders" primaryHref="/admin/orders" />}
    >
      <AdminAnalyticsClient />
    </AdminShell>
  );
}
