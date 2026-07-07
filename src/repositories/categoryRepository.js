import prisma from "@/lib/prisma";

export async function findCategories(orderBy = { name: "asc" }) {
  return prisma.category.findMany({
    orderBy
  });
}

export async function findAdminCategories({ where = {}, skip, take } = {}) {
  return prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    ...(skip != null ? { skip } : {}),
    ...(take != null ? { take } : {})
  });
}

export async function countAdminCategories(where = {}) {
  return prisma.category.count({ where });
}

export async function findCategoriesForHome(limit = 6) {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    take: limit
  });
}

export async function countCategories() {
  return prisma.category.count();
}
