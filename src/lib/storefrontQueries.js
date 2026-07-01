import prisma from "@/lib/prisma";
import {
  getProductCategoryCount,
  getProductCount,
  listFeaturedStorefrontProducts,
  listHomeCategories
} from "@/services/productService";

export function enrichRobotKit(robotKit) {
  return {
    ...robotKit,
    level: robotKit.level || "Beginner",
    stockQuantity: Number(robotKit.stockQuantity ?? 0),
    image: robotKit.image || null,
    description: robotKit.description || ""
  };
}

export async function getStorefrontCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getHomePageData() {
  const [categories, featuredProducts, kits, productCount, userCount, categoryCount, kitCount] = await Promise.all([
    listHomeCategories(6),
    listFeaturedStorefrontProducts(8),
    prisma.robotKit.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3
    }),
    getProductCount(),
    prisma.user.count(),
    getProductCategoryCount(),
    prisma.robotKit.count()
  ]);

  return {
    categories,
    featuredProducts,
    featuredKits: kits.map(enrichRobotKit),
    heroStats: [
      { label: "Products", value: `${productCount}+` },
      { label: "Builders", value: `${userCount}+` },
      { label: "Categories", value: `${categoryCount}` },
      { label: "Robot Kits", value: `${kitCount}` }
    ]
  };
}

export async function getFeaturedRobotKits(limit = 3) {
  const kits = await prisma.robotKit.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit
  });
  return kits.map(enrichRobotKit);
}

export async function getHeroStats() {
  const [productCount, userCount, categoryCount, kitCount] = await Promise.all([
    getProductCount(),
    prisma.user.count(),
    getProductCategoryCount(),
    prisma.robotKit.count()
  ]);
  return [
    { label: "Products", value: `${productCount}+` },
    { label: "Builders", value: `${userCount}+` },
    { label: "Categories", value: `${categoryCount}` },
    { label: "Robot Kits", value: `${kitCount}` }
  ];
}

export async function getStorefrontRobotKits() {
  const kits = await prisma.robotKit.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
  });

  return kits.map(enrichRobotKit);
}
