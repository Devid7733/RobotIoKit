import AdminHeader from "@/components/admin/AdminHeader";
import AdminProductManager from "@/components/admin/AdminProductManager";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";
import { listProductCategories } from "@/services/productService";

export const metadata = {
  title: "Admin Products | RobotIoKit"
};

export default async function AdminProductsPage() {
  await requireAdminSession();
  const categories = await listProductCategories();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Products" primaryLabel="Manage Categories" primaryHref="/admin/categories" />}
    >
      <AdminProductManager categories={categories} />
    </AdminShell>
  );
}
