import prisma from "@/lib/prisma";

export async function findCategories(orderBy = { name: "asc" }) {
  return prisma.category.findMany({
    orderBy
  });
}

export async function findAdminCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });
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
