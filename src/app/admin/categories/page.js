import AdminCategoryManager from "@/components/admin/AdminCategoryManager";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/adminSession";
import { listAdminCategories } from "@/services/categoryService";

export const metadata = {
  title: "Admin Categories | RobotIoKit"
};

export default async function AdminCategoriesPage() {
  await requireAdminSession();
  const categories = await listAdminCategories();

  return (
    <AdminShell
      sidebar={<AdminSidebar />}
      header={<AdminHeader title="Categories" primaryLabel="Add Category" primaryHref="/admin/categories" />}
    >
      <AdminCategoryManager initialCategories={categories} />
    </AdminShell>
  );
}
