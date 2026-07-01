import AdminHeader from "@/components/admin/AdminHeader";
import AdminOrderDetailClient from "@/components/admin/AdminOrderDetailClient";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";

export const metadata = {
  title: "Admin Order Detail | RobotIoKit"
};

export default async function AdminOrderDetailPage({ params }) {
  await requireAdminSession();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Order Detail" primaryLabel="Back to Orders" primaryHref="/admin/orders" />}
    >
      <AdminOrderDetailClient orderId={params.id} />
    </AdminShell>
  );
}
