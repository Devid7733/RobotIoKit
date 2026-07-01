import prisma from "@/lib/prisma";

export async function findAdminRobotKits() {
  return prisma.robotKit.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function findRobotKitById(id) {
  return prisma.robotKit.findUnique({
    where: { id }
  });
}

export async function createRobotKit(data) {
  return prisma.robotKit.create({
    data
  });
}

export async function updateRobotKit(id, data) {
  return prisma.robotKit.update({
    where: { id },
    data
  });
}

export async function deleteRobotKit(id) {
  return prisma.robotKit.delete({
    where: { id }
  });
}

export async function findStorefrontRobotKits(limit, search, level, minPrice, maxPrice) {
  const normalizedSearch = String(search || "").trim();
  const andClauses = [];

  if (normalizedSearch) {
    andClauses.push({
      OR: [
        { name: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } },
        { sku: { contains: normalizedSearch, mode: "insensitive" } },
        { level: { contains: normalizedSearch, mode: "insensitive" } }
      ]
    });
  }

  if (level) andClauses.push({ level });
  if (minPrice) andClauses.push({ price: { gte: Number(minPrice) } });
  if (maxPrice) andClauses.push({ price: { lte: Number(maxPrice) } });

  return prisma.robotKit.findMany({
    where: andClauses.length ? { AND: andClauses } : undefined,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    ...(limit ? { take: limit } : {})
  });
}

export async function findStorefrontRobotKitBySlug(slug) {
  return prisma.robotKit.findUnique({
    where: { slug }
  });
}

export async function findRobotKitsByIds(ids) {
  return prisma.robotKit.findMany({
    where: {
      id: {
        in: ids
      }
    },
    select: {
      id: true,
      name: true
    }
  });
}
