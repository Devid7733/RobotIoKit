import {
  countAdminProducts,
  countProducts,
  countStorefrontProducts,
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  findAdminProducts,
  findAlsoBoughtProducts,
  findFeaturedProducts,
  findNewArrivalsProducts,
  findCompatibleProductCandidates,
  findProductById,
  findProductBySlug,
  findProductSlugs,
  findProductsBySlugs,
  findRelatedProducts,
  findStorefrontProductVoltages,
  findStorefrontProducts,
  updateProduct as updateProductRecord
} from "@/repositories/productRepository";
import { countCategories, findCategories, findCategoriesForHome } from "@/repositories/categoryRepository";
import { unstable_cache } from "next/cache";
import { cache } from "react";

const categoryIconMap = {
  controllers: "chip",
  sensors: "pulse",
  "motors-and-drivers": "bolt",
  power: "cube",
  "iot-and-communication": "wifi",
  accessories: "wrench"
};

const complementaryCategoryMap = {
  Controllers: ["Sensors", "Motors & Drivers", "Power", "IoT & Communication", "Accessories"],
  Sensors: ["Controllers", "Accessories", "Power", "Motors & Drivers"],
  "Motors & Drivers": ["Controllers", "Power", "Accessories"],
  Power: ["Controllers", "Motors & Drivers", "Accessories"],
  "IoT & Communication": ["Controllers", "Sensors", "Accessories"],
  Accessories: ["Controllers", "Sensors", "Motors & Drivers", "Power"]
};

const usefulAccessoryTerms = [
  "jumper",
  "breadboard",
  "wire",
  "wiring",
  "chassis",
  "wheel",
  "mount",
  "bracket",
  "standoff",
  "connector",
  "adapter",
  "screw"
];

const compatibilityKeywordRules = [
  {
    base: ["esp32"],
    candidate: ["sensor", "oled", "jumper", "breadboard", "motor driver", "driver", "power", "buck", "boost"],
    reason: "ESP32 build"
  },
  {
    base: ["arduino"],
    candidate: ["5v", "sensor", "l298n", "sg90", "jumper", "breadboard", "shield", "servo"],
    reason: "Arduino build"
  },
  {
    base: ["ultrasonic", "hc-sr04"],
    candidate: ["controller", "esp32", "arduino", "chassis", "motor driver", "l298n", "tb6612", "wheel", "jumper"],
    reason: "Robot car build"
  },
  {
    base: ["line tracking", "tcrt5000", "ir sensor", "ir obstacle"],
    candidate: ["controller", "esp32", "arduino", "chassis", "motor driver", "l298n", "tb6612", "wheel"],
    reason: "Line follower build"
  },
  {
    base: ["motor driver", "l298n", "tb6612", "drv8833", "bts7960"],
    candidate: ["motor", "tt", "wheel", "chassis", "battery", "holder", "controller", "esp32", "arduino", "power"],
    reason: "Motor drive pair"
  },
  {
    base: ["tt motor"],
    candidate: ["wheel", "chassis", "motor driver", "l298n", "tb6612", "battery", "holder"],
    reason: "Robot drivetrain"
  },
  {
    base: ["servo", "sg90", "mg996r"],
    candidate: ["controller", "esp32", "arduino", "servo mount", "bracket", "power", "pwm", "battery"],
    reason: "Servo project"
  },
  {
    base: ["battery", "18650", "power"],
    candidate: ["controller", "motor driver", "power module", "buck", "boost", "charger", "connector"],
    reason: "Power pairing"
  },
  {
    base: ["chassis", "wheel", "robot car"],
    candidate: ["motor", "wheel", "motor driver", "controller", "battery", "holder", "ultrasonic", "line tracking"],
    reason: "Robot car build"
  }
];

// Converts any voltage string to a simple canonical value, or null if unrecognisable.
// "5V via USB / 3.3V logic" → "5V"   "3.3v" → "3.3V"   "" → null
export function normalizeVoltage(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/\b(\d+(?:\.\d+)?)\s*[Vv]\b/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return `${Number.isInteger(num) ? num : num.toFixed(1)}V`;
}

function getVoltageNumber(value) {
  const match = String(value || "").match(/^(\d+(?:\.\d+)?)V$/i);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function sortVoltages(first, second) {
  const voltageDifference = getVoltageNumber(first) - getVoltageNumber(second);
  return voltageDifference || String(first).localeCompare(String(second));
}

function normalizeVoltageList(value) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim());
  const uniqueVoltages = [...new Set(rawItems.map(normalizeVoltage).filter(Boolean))];

  return uniqueVoltages.sort(sortVoltages);
}

function getProductVoltages(product) {
  const voltages = normalizeVoltageList(product?.voltages);

  if (voltages.length) {
    return voltages;
  }

  return normalizeVoltageList(product?.voltage);
}

function formatVoltageLabel(voltages) {
  return voltages.length ? voltages.join(", ") : null;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryName(category) {
  if (!category) {
    return "Components";
  }

  if (typeof category === "string") {
    return category;
  }

  return category.name;
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function getProductSearchText(product) {
  const categoryName = getCategoryName(product.category);
  const specsText = Array.isArray(product.specifications)
    ? product.specifications.map((spec) => `${spec?.label || ""} ${spec?.value || ""}`).join(" ")
    : "";
  const listText = [
    ...(Array.isArray(product.features) ? product.features : []),
    ...(Array.isArray(product.compatibility) ? product.compatibility : []),
    ...(Array.isArray(product.voltages) ? product.voltages : [])
  ].join(" ");

  return normalizeText([product.name, product.slug, product.sku, product.description, product.overview, categoryName, specsText, listText].join(" "));
}

function includesAnyTerm(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getSharedVoltages(baseProduct, candidateProduct) {
  const baseVoltages = getProductVoltages(baseProduct);
  const candidateVoltages = getProductVoltages(candidateProduct);
  return candidateVoltages.filter((voltage) => baseVoltages.includes(voltage));
}

function addReason(reasons, reason) {
  if (reason && !reasons.includes(reason)) {
    reasons.push(reason);
  }
}

function getCategoryReason(baseCategory, candidateCategory) {
  if (candidateCategory === "Controllers") {
    return "Works with controllers";
  }

  if (baseCategory === "Controllers") {
    return "Works with controllers";
  }

  if (candidateCategory === "Accessories") {
    return "Useful accessory";
  }

  if (candidateCategory === "Motors & Drivers" || baseCategory === "Motors & Drivers") {
    return "Motor build";
  }

  if (candidateCategory === "Power" || baseCategory === "Power") {
    return "Power pairing";
  }

  return "Compatible category";
}

function getDefaultProductImage(slug) {
  return slug ? `/images/products/${slug}.jpg` : "/images/products/placeholder.jpg";
}

function normalizeStringList(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.map((item) => String(item || "").trim()).filter(Boolean);
  return items.length ? items : fallback;
}

function normalizeSpecifications(value, product) {
  const normalizedVoltage = String(product.voltage || formatVoltageLabel(product.voltages || []) || "").trim();

  if (Array.isArray(value)) {
    const items = value
      .map((item) => ({
        label: String(item?.label || "").trim(),
        value: String(item?.value || "").trim()
      }))
      .filter((item) => item.label && item.value);

    if (normalizedVoltage && !items.some((item) => item.label.toLowerCase() === "voltage")) {
      items.unshift({ label: "Voltage", value: normalizedVoltage });
    }

    if (items.length) {
      return items;
    }
  }

  const fallbackItems = [
    { label: "SKU", value: product.sku || "N/A" },
    { label: "Stock", value: String(product.stock ?? 0) },
    { label: "Category", value: getCategoryName(product.category) },
    { label: "Use Case", value: "Robotics and embedded prototypes" }
  ];

  if (normalizedVoltage) {
    fallbackItems.unshift({ label: "Voltage", value: normalizedVoltage });
  }

  return fallbackItems;
}

function mapProductRecord(product) {
  if (!product) {
    return null;
  }

  const voltages = getProductVoltages(product);

  return {
    ...product,
    voltages,
    voltage: formatVoltageLabel(voltages),
    imageUrl: product.imageUrl || null,
    image: product.imageUrl || null
  };
}

function toProductWriteData(input) {
  const hasVoltages = Object.prototype.hasOwnProperty.call(input, "voltages");
  const hasVoltage = Object.prototype.hasOwnProperty.call(input, "voltage");
  const voltages = hasVoltages
    ? normalizeVoltageList(input.voltages)
    : hasVoltage
      ? normalizeVoltageList(input.voltage)
      : undefined;

  return {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    sku: input.sku || null,
    price: Number(input.price),
    stock: Number(input.stock ?? 0),
    imageUrl: input.imageUrl ?? input.image ?? null,
    voltages,
    voltage: voltages === undefined ? undefined : formatVoltageLabel(voltages),
    badge: Object.prototype.hasOwnProperty.call(input, "badge") ? input.badge || null : undefined,
    overview: Object.prototype.hasOwnProperty.call(input, "overview") ? input.overview || null : undefined,
    features: Object.prototype.hasOwnProperty.call(input, "features") ? input.features || [] : undefined,
    compatibility:
      Object.prototype.hasOwnProperty.call(input, "compatibility") ? input.compatibility || [] : undefined,
    specifications:
      Object.prototype.hasOwnProperty.call(input, "specifications") ? input.specifications || [] : undefined,
    featured: input.featured ?? false,
    categoryId: input.categoryId
  };
}

export function enrichProduct(product) {
  const mappedProduct = mapProductRecord(product);
  const image = mappedProduct.imageUrl || getDefaultProductImage(mappedProduct.slug);
  const categoryName = getCategoryName(mappedProduct.category);

  return {
    ...mappedProduct,
    imageUrl: image,
    image,
    voltage: mappedProduct.voltage || null,
    description: mappedProduct.description || "",
    category: categoryName,
    badge: mappedProduct.badge || (mappedProduct.featured ? "Featured" : "Popular"),
    overview: mappedProduct.overview || mappedProduct.description || "",
    features: normalizeStringList(mappedProduct.features, [
      "Project ready",
      "Student friendly",
      "Reliable stock",
      "Tested module"
    ]),
    compatibility: normalizeStringList(mappedProduct.compatibility, [
      "ESP32 boards",
      "Starter robot builds",
      "Lab prototypes"
    ]),
    specifications: normalizeSpecifications(mappedProduct.specifications, {
      ...mappedProduct,
      category: categoryName
    })
  };
}

export function toStorefrontCategory(category) {
  return {
    ...category,
    icon: categoryIconMap[category.slug] || "cube",
    href: `/products?category=${category.slug}`
  };
}

export async function listAdminProducts() {
  const products = await findAdminProducts();
  return products.map(mapProductRecord);
}

export async function listAdminProductsPaginated({ search, page = 1, pageSize = 20 } = {}) {
  const normalizedSearch = String(search || "").trim();
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * pageSize;

  const where = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: "insensitive" } },
          { sku: { contains: normalizedSearch, mode: "insensitive" } },
          { category: { name: { contains: normalizedSearch, mode: "insensitive" } } }
        ]
      }
    : {};

  const [products, total] = await Promise.all([
    findAdminProducts({ where, skip, take: pageSize }),
    countAdminProducts(where)
  ]);

  return {
    items: products.map(mapProductRecord),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listProductCategories() {
  return findCategories();
}

// Categories rarely change (admin-only edits) but are queried on every storefront
// page via StorefrontShell's navbar — cache for a few minutes rather than hitting
// the database on every single request.
const getCachedCategories = unstable_cache(() => findCategories(), ["storefront-categories"], {
  revalidate: 300
});

export async function listStorefrontCategories() {
  return getCachedCategories();
}

export async function listHomeCategories(limit = 6) {
  const categories = await findCategoriesForHome(limit);
  return categories.map(toStorefrontCategory);
}

export async function getProductCategoryCount() {
  return countCategories();
}

export async function getProductCount() {
  return countProducts();
}

export async function createProduct(input) {
  const product = await createProductRecord(toProductWriteData(input));
  return mapProductRecord(product);
}

export async function getProductById(id) {
  const product = await findProductById(id);
  return mapProductRecord(product);
}

export async function updateProduct(id, input) {
  const product = await updateProductRecord(id, toProductWriteData(input));
  return mapProductRecord(product);
}

export async function deleteProduct(id) {
  return deleteProductRecord(id);
}

// Catalog listings only change via admin edits, but are re-queried on every
// filter/pagination combination a shopper requests — cache each distinct
// combination for a short window instead of hitting the database every time.
// unstable_cache incorporates the actual call arguments into its cache key,
// so different filters/pages get their own entries automatically.
const getCachedStorefrontProducts = unstable_cache(
  async (categorySlug, voltage, search, maxPrice, minPrice, inStock) => {
    const products = await findStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock);
    return products.map(enrichProduct);
  },
  ["storefront-products"],
  { revalidate: 60 }
);

export async function listStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock) {
  return getCachedStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock);
}

const getCachedStorefrontProductsPaginated = unstable_cache(
  async (categorySlug, voltage, search, maxPrice, minPrice, inStock, page = 1, pageSize = 24) => {
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * pageSize;

    const [products, total] = await Promise.all([
      findStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock, { skip, take: pageSize }),
      countStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock)
    ]);

    return {
      products: products.map(enrichProduct),
      total,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  },
  ["storefront-products-paginated"],
  { revalidate: 60 }
);

export async function listStorefrontProductsPaginated(categorySlug, voltage, search, maxPrice, minPrice, inStock, page = 1, pageSize = 24) {
  return getCachedStorefrontProductsPaginated(categorySlug, voltage, search, maxPrice, minPrice, inStock, page, pageSize);
}

const getCachedStorefrontVoltageOptions = unstable_cache(
  async (categorySlug, search) => {
    const products = await findStorefrontProductVoltages(categorySlug, search);
    return normalizeVoltageList(products.flatMap((product) => product.voltages || []));
  },
  ["storefront-voltage-options"],
  { revalidate: 60 }
);

export async function listStorefrontVoltageOptions(categorySlug, search) {
  return getCachedStorefrontVoltageOptions(categorySlug, search);
}

// Memoized per-request: the product detail page calls this from both
// generateMetadata() and the page body — cache() collapses those into one query.
export const getStorefrontProductBySlug = cache(async (slug) => {
  const product = await findProductBySlug(slug);
  return product ? enrichProduct(product) : null;
});

export async function listRelatedProducts(productId, categoryId) {
  const products = await findRelatedProducts(productId, categoryId);
  return products.map(enrichProduct);
}

export function scoreCompatibleProduct(baseProduct, candidateProduct) {
  const baseCategory = getCategoryName(baseProduct.category);
  const candidateCategory = getCategoryName(candidateProduct.category);
  const baseText = getProductSearchText(baseProduct);
  const candidateText = getProductSearchText(candidateProduct);
  const reasons = [];
  let score = 0;

  if (baseProduct.id === candidateProduct.id) {
    return { score: 0, reasons: [] };
  }

  if (getSharedVoltages(baseProduct, candidateProduct).length) {
    score += 3;
    addReason(reasons, "Same voltage");
  }

  if (complementaryCategoryMap[baseCategory]?.includes(candidateCategory)) {
    score += 4;
    addReason(reasons, getCategoryReason(baseCategory, candidateCategory));
  }

  for (const rule of compatibilityKeywordRules) {
    if (includesAnyTerm(baseText, rule.base) && includesAnyTerm(candidateText, rule.candidate)) {
      score += 3;
      addReason(reasons, rule.reason);
    }
  }

  if (includesAnyTerm(baseText, ["motor driver", "l298n", "tb6612", "drv8833"]) && includesAnyTerm(candidateText, ["battery holder", "18650"])) {
    score += 4;
    addReason(reasons, "Power pairing");
  }

  if (includesAnyTerm(baseText, ["chassis", "robot car"]) && includesAnyTerm(candidateText, ["battery holder", "motor driver", "controller", "tt motor", "wheel"])) {
    score += 3;
    addReason(reasons, "Robot car build");
  }

  if (includesAnyTerm(baseText, ["ultrasonic", "hc-sr04", "line tracking", "tcrt5000"]) && includesAnyTerm(candidateText, ["jumper", "chassis", "wheel", "motor driver", "controller"])) {
    score += 3;
    addReason(reasons, "Robot car build");
  }

  if (candidateCategory === "Accessories" && includesAnyTerm(candidateText, usefulAccessoryTerms)) {
    score += 2;
    addReason(reasons, "Useful accessory");
  }

  if (baseCategory === candidateCategory && baseProduct.slug !== candidateProduct.slug) {
    score += 1;
    addReason(reasons, "Similar function");
  }

  if (Number(candidateProduct.stock || 0) > 0) {
    score += 1;
  }

  return {
    score,
    reasons: reasons.slice(0, 3)
  };
}

export async function getCompatibleProducts(productIdOrSlug, limit = 8) {
  const product = (await findProductBySlug(productIdOrSlug)) || (await findProductById(productIdOrSlug));

  if (!product) {
    return [];
  }

  const candidates = await findCompatibleProductCandidates(product.id);

  return candidates
    .map((candidate) => {
      const result = scoreCompatibleProduct(product, candidate);
      return {
        product: candidate,
        score: result.score,
        reasons: result.reasons
      };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        Number(second.product.stock || 0) - Number(first.product.stock || 0) ||
        Number(second.product.featured || false) - Number(first.product.featured || false)
    )
    .slice(0, limit)
    .map((entry) => ({
      ...enrichProduct(entry.product),
      compatibilityScore: entry.score,
      compatibilityReasons: entry.reasons
    }));
}

export async function listProductSlugs() {
  return findProductSlugs();
}

export async function getAlsoBoughtProducts(productId, limit = 6) {
  const products = await findAlsoBoughtProducts(productId, limit);
  return products.map((product) => ({
    ...enrichProduct(product),
    coPurchaseCount: product.coPurchaseCount
  }));
}

export async function listFeaturedStorefrontProducts(limit = 8) {
  const products = await findFeaturedProducts(limit);
  return products.map(enrichProduct);
}

export async function listNewArrivalsProducts(limit = 6) {
  const products = await findNewArrivalsProducts(limit);
  return products.map(enrichProduct);
}

export async function getCheckoutSeedProducts(seedItems) {
  const products = await findProductsBySlugs(seedItems.map((item) => item.slug));

  return seedItems
    .map((seedItem) => {
      const product = products.find((item) => item.slug === seedItem.slug);

      if (!product) {
        return null;
      }

      const enriched = enrichProduct(product);

      return {
        id: product.id,
        slug: product.slug,
        productId: product.id,
        name: product.name,
        qty: seedItem.quantity,
        price: product.price,
        image: enriched.image,
        category: enriched.category
      };
    })
    .filter(Boolean);
}
