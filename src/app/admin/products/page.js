import AdminHeader from "@/components/admin/AdminHeader";
import AdminProductManager from "@/components/admin/AdminProductManager";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";
import { listAdminProducts, listProductCategories } from "@/services/productService";

export const metadata = {
  title: "Admin Products | RobotIoKit"
};

export default async function AdminProductsPage() {
  await requireAdminSession();
  const [products, categories] = await Promise.all([
    listAdminProducts(),
    listProductCategories()
  ]);

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Products" primaryLabel="Manage Categories" primaryHref="/admin/categories" />}
    >
      <AdminProductManager initialProducts={products} categories={categories} />
    </AdminShell>
  );
}
