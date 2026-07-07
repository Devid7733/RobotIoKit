import {
  countAdminRobotKits,
  createRobotKit as createRobotKitRecord,
  deleteRobotKit as deleteRobotKitRecord,
  findAdminRobotKits,
  findRobotKitById,
  findStorefrontRobotKitBySlug,
  findStorefrontRobotKits,
  updateRobotKit as updateRobotKitRecord
} from "@/repositories/robotKitRepository";
import { cache } from "react";
import { unstable_cache } from "next/cache";

function mapRobotKitRecord(robotKit) {
  if (!robotKit) {
    return null;
  }

  return {
    ...robotKit,
    level: robotKit.level || "Beginner",
    stockQuantity: Number(robotKit.stockQuantity ?? 0),
    image: robotKit.image || "/images/products/placeholder.jpg",
    description: robotKit.description || ""
  };
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createServiceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toRobotKitWriteData(input) {
  const stockQuantity = Number(input.stockQuantity ?? 0);

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    throw createServiceError("Stock quantity must be 0 or greater.", 400);
  }

  return {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    sku: input.sku || null,
    price: Number(input.price),
    level: input.level,
    stockQuantity: Math.floor(stockQuantity),
    image: input.image || null,
    featured: input.featured ?? false
  };
}

export async function getRobotKitById(id) {
  return findRobotKitById(id);
}

// Memoized per-request: the robot-kit detail page calls this from both
// generateMetadata() and the page body — cache() collapses those into one query.
export const getStorefrontRobotKitBySlug = cache(async (slug) => {
  const robotKit = await findStorefrontRobotKitBySlug(slug);
  return mapRobotKitRecord(robotKit);
});

export async function listAdminRobotKits() {
  return findAdminRobotKits();
}

export async function listAdminRobotKitsPaginated({ search, page = 1, pageSize = 20 } = {}) {
  const normalizedSearch = String(search || "").trim();
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * pageSize;

  const where = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: "insensitive" } },
          { sku: { contains: normalizedSearch, mode: "insensitive" } },
          { level: { contains: normalizedSearch, mode: "insensitive" } }
        ]
      }
    : {};

  const [robotKits, total] = await Promise.all([
    findAdminRobotKits({ where, skip, take: pageSize }),
    countAdminRobotKits(where)
  ]);

  return {
    items: robotKits.map(mapRobotKitRecord),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function createRobotKit(input) {
  return createRobotKitRecord(toRobotKitWriteData(input));
}

export async function updateRobotKit(id, input) {
  return updateRobotKitRecord(id, toRobotKitWriteData(input));
}

export async function deleteRobotKit(id) {
  return deleteRobotKitRecord(id);
}

// Catalog listings only change via admin edits, but are re-queried on every
// filter combination a shopper requests — cache each distinct combination for
// a short window instead of hitting the database every time. unstable_cache
// incorporates the actual call arguments into its cache key, so different
// filters get their own entries automatically.
const getCachedStorefrontRobotKits = unstable_cache(
  async (limit, search, level, minPrice, maxPrice) => {
    const robotKits = await findStorefrontRobotKits(limit, search, level, minPrice, maxPrice);
    return robotKits.map(mapRobotKitRecord);
  },
  ["storefront-robot-kits"],
  { revalidate: 60 }
);

export async function listStorefrontRobotKits(limit, search, level, minPrice, maxPrice) {
  return getCachedStorefrontRobotKits(limit, search, level, minPrice, maxPrice);
}
