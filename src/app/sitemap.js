import { listProductSlugs } from "@/services/productService";
import { listStorefrontRobotKits } from "@/services/robotKitService";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://robotiokit.com";

export default async function sitemap() {
  const [productSlugs, kits] = await Promise.all([
    listProductSlugs(),
    listStorefrontRobotKits()
  ]);

  const staticPages = ["/", "/products", "/robot-kits", "/search"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1.0 : 0.8
  }));

  const productPages = productSlugs.map(({ slug }) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  const kitPages = kits.map((kit) => ({
    url: `${BASE_URL}/robot-kits/${kit.slug || kit.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...staticPages, ...productPages, ...kitPages];
}
