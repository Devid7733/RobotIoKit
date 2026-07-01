import { findAdminCategories, findCategories } from "@/repositories/categoryRepository";

export async function listAdminCategories() {
  return findAdminCategories();
}

export async function listCategories() {
  return findCategories();
}
