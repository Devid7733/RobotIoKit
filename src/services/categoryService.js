import { countAdminCategories, findAdminCategories, findCategories } from "@/repositories/categoryRepository";

export async function listAdminCategories() {
  return findAdminCategories();
}

export async function listAdminCategoriesPaginated({ search, page = 1, pageSize = 20 } = {}) {
  const normalizedSearch = String(search || "").trim();
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * pageSize;

  const where = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: "insensitive" } },
          { slug: { contains: normalizedSearch, mode: "insensitive" } },
          { description: { contains: normalizedSearch, mode: "insensitive" } }
        ]
      }
    : {};

  const [categories, total] = await Promise.all([
    findAdminCategories({ where, skip, take: pageSize }),
    countAdminCategories(where)
  ]);

  return {
    items: categories,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listCategories() {
  return findCategories();
}
