import {
  createRobotKit as createRobotKitRecord,
  deleteRobotKit as deleteRobotKitRecord,
  findAdminRobotKits,
  findRobotKitById,
  findStorefrontRobotKitBySlug,
  findStorefrontRobotKits,
  updateRobotKit as updateRobotKitRecord
} from "@/repositories/robotKitRepository";
import { cache } from "react";

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

export async function createRobotKit(input) {
  return createRobotKitRecord(toRobotKitWriteData(input));
}

export async function updateRobotKit(id, input) {
  return updateRobotKitRecord(id, toRobotKitWriteData(input));
}

export async function deleteRobotKit(id) {
  return deleteRobotKitRecord(id);
}

export async function listStorefrontRobotKits(limit, search, level, minPrice, maxPrice) {
  const robotKits = await findStorefrontRobotKits(limit, search, level, minPrice, maxPrice);
  return robotKits.map(mapRobotKitRecord);
}
