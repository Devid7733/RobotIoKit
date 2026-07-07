import prisma from "@/lib/prisma";

function normalizeVoltage(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/\b(\d+(?:\.\d+)?)\s*[Vv]\b/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return `${Number.isInteger(num) ? num : num.toFixed(1)}V`;
}

const productWithCategory = {
  category: true
};

export async function findAdminProducts({ where = {}, skip, take } = {}) {
  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: productWithCategory,
    ...(skip != null ? { skip } : {}),
    ...(take != null ? { take } : {})
  });
}

export async function countAdminProducts(where = {}) {
  return prisma.product.count({ where });
}

export async function findProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: productWithCategory
  });
}

export async function createProduct(data) {
  return prisma.product.create({
    data,
    include: productWithCategory
  });
}

export async function updateProduct(id, data) {
  return prisma.product.update({
    where: { id },
    data,
    include: productWithCategory
  });
}

export async function deleteProduct(id) {
  return prisma.product.delete({
    where: { id }
  });
}

function buildStorefrontProductWhere(categorySlug, voltage, search, maxPrice, minPrice, inStock) {
  const normalizedSearch = String(search || "").trim();
  const normalizedMaxPrice = Number(maxPrice);
  const normalizedMinPrice = Number(minPrice);
  const normalizedVoltage = normalizeVoltage(voltage);
  const searchVoltage = normalizeVoltage(normalizedSearch);
  const hasMaxPrice = Number.isFinite(normalizedMaxPrice) && normalizedMaxPrice > 0;
  const hasMinPrice = Number.isFinite(normalizedMinPrice) && normalizedMinPrice > 0;

  return {
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(normalizedVoltage ? { voltages: { has: normalizedVoltage } } : {}),
    ...(hasMinPrice || hasMaxPrice
      ? {
          price: {
            ...(hasMinPrice ? { gte: normalizedMinPrice } : {}),
            ...(hasMaxPrice ? { lte: normalizedMaxPrice } : {})
          }
        }
      : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    ...(normalizedSearch
      ? {
          OR: [
            { name: { contains: normalizedSearch, mode: "insensitive" } },
            { description: { contains: normalizedSearch, mode: "insensitive" } },
            { sku: { contains: normalizedSearch, mode: "insensitive" } },
            ...(searchVoltage ? [{ voltages: { has: searchVoltage } }] : []),
            { category: { name: { contains: normalizedSearch, mode: "insensitive" } } }
          ]
        }
      : {})
  };
}

export async function findStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock, { skip, take } = {}) {
  return prisma.product.findMany({
    where: buildStorefrontProductWhere(categorySlug, voltage, search, maxPrice, minPrice, inStock),
    include: productWithCategory,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    ...(skip != null ? { skip } : {}),
    ...(take != null ? { take } : {})
  });
}

export async function countStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock) {
  return prisma.product.count({
    where: buildStorefrontProductWhere(categorySlug, voltage, search, maxPrice, minPrice, inStock)
  });
}

export async function findStorefrontProductVoltages(categorySlug, search) {
  const normalizedSearch = String(search || "").trim();
  const searchVoltage = normalizeVoltage(normalizedSearch);

  return prisma.product.findMany({
    where: {
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug
            }
          }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              },
              {
                description: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              },
              {
                sku: {
                  contains: normalizedSearch,
                  mode: "insensitive"
                }
              },
              ...(searchVoltage
                ? [
                    {
                      voltages: {
                        has: searchVoltage
                      }
                    }
                  ]
                : []),
              {
                category: {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive"
                  }
                }
              }
            ]
          }
        : {})
    },
    select: {
      voltages: true
    }
  });
}

export async function findProductBySlug(slug) {
  return prisma.product.findUnique({
    where: { slug },
    include: productWithCategory
  });
}

export async function findRelatedProducts(productId, categoryId) {
  return prisma.product.findMany({
    where: {
      id: {
        not: productId
      },
      OR: [{ categoryId }, { featured: true }]
    },
    include: productWithCategory,
    take: 4,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
  });
}

export async function findCompatibleProductCandidates(productId) {
  return prisma.product.findMany({
    where: {
      id: {
        not: productId
      }
    },
    include: productWithCategory,
    orderBy: [{ stock: "desc" }, { featured: "desc" }, { createdAt: "desc" }]
  });
}

export async function findProductSlugs() {
  return prisma.product.findMany({
    select: { slug: true }
  });
}

export async function findFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    include: productWithCategory,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit
  });
}

export async function findNewArrivalsProducts(limit = 6) {
  return prisma.product.findMany({
    where: { stock: { gt: 0 } },
    include: productWithCategory,
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function countProducts() {
  return prisma.product.count();
}

export async function findProductsBySlugs(slugs) {
  return prisma.product.findMany({
    where: {
      slug: {
        in: slugs
      }
    },
    include: productWithCategory
  });
}

export async function findProductsByIds(ids) {
  return prisma.product.findMany({
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

export async function findAlsoBoughtProducts(productId, limit = 6) {
  const ordersContainingProduct = await prisma.orderItem.findMany({
    where: { productId },
    select: { orderId: true }
  });

  if (!ordersContainingProduct.length) return [];

  const orderIds = ordersContainingProduct.map((item) => item.orderId);

  const coPurchased = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId, notIn: [productId] }
    },
    _count: { orderId: true },
    orderBy: { _count: { orderId: "desc" } },
    take: limit * 2
  });

  const coPurchasedProductIds = coPurchased.map((item) => item.productId).filter(Boolean);

  if (!coPurchasedProductIds.length) return [];

  const countMap = Object.fromEntries(coPurchased.map((item) => [item.productId, item._count.orderId]));

  const products = await prisma.product.findMany({
    where: {
      id: { in: coPurchasedProductIds },
      stock: { gt: 0 }
    },
    include: productWithCategory,
    take: limit * 2
  });

  return products
    .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0))
    .slice(0, limit)
    .map((product) => ({ ...product, coPurchaseCount: countMap[product.id] || 0 }));
}
