import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import Icon from "@/components/common/Icon";
import InStockFilter from "@/components/storefront/InStockFilter";
import PriceRangeFilter from "@/components/storefront/PriceRangeFilter";
import ProductSearchFilter from "@/components/storefront/ProductSearchFilter";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { listStorefrontCategories, listStorefrontProducts, listStorefrontProductsPaginated, listStorefrontVoltageOptions } from "@/services/productService";

export default async function ProductsPage({ searchParams }) {
  const categorySlug = searchParams?.category;
  const voltage = searchParams?.voltage;
  const search = String(searchParams?.search || "").trim() || undefined;
  const inStock = searchParams?.inStock === "true";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const maxPrice = Number(searchParams?.maxPrice);
  const activeMaxPrice = Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null;
  const minPrice = Number(searchParams?.minPrice);
  const activeMinPrice = Number.isFinite(minPrice) && minPrice > 0 ? minPrice : null;

  const [categories, { products, total, totalPages }, priceSourceProducts, voltageOptions] = await Promise.all([
    listStorefrontCategories(),
    listStorefrontProductsPaginated(categorySlug, voltage, search, activeMaxPrice, activeMinPrice, inStock, page),
    listStorefrontProducts(categorySlug, voltage, search),
    listStorefrontVoltageOptions(categorySlug, search)
  ]);

  const catalogMax = Math.max(
    100,
    Math.ceil(Math.max(...priceSourceProducts.map((product) => Number(product.price)), 0) / 10) * 10
  );

  function buildProductsHref(nextCategory, nextVoltage, nextPage) {
    const query = new URLSearchParams();

    if (nextCategory) query.set("category", nextCategory);
    if (nextVoltage) query.set("voltage", nextVoltage);
    if (activeMinPrice) query.set("minPrice", String(activeMinPrice));
    if (activeMaxPrice) query.set("maxPrice", String(activeMaxPrice));
    if (inStock) query.set("inStock", "true");
    if (search) query.set("search", search);
    if (nextPage && nextPage > 1) query.set("page", String(nextPage));

    const queryString = query.toString();
    return queryString ? `/products?${queryString}` : "/products";
  }

  return (
    <StorefrontShell>
      <div className="storefront-container py-8 sm:py-10">
        <nav className="mb-7 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-blue">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-slate-800">Products</li>
          </ol>
        </nav>

        <section>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            All Products
          </h1>
          <p className="mt-3 text-base text-slate-500">
            {total} product{total === 1 ? "" : "s"} found
            {search ? (
              <>
                {" "}
                for <span className="font-semibold text-slate-900">&quot;{search}&quot;</span>
              </>
            ) : null}
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px,1fr] xl:grid-cols-[300px,1fr]">
          <aside className="h-fit rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-slate-900">Filters</h2>

            <div className="mt-8">
              <div className="text-sm font-semibold text-slate-900">Search</div>
              <ProductSearchFilter initialValue={search} />
            </div>

            <div className="mt-8">
              <div className="text-sm font-semibold text-slate-900">Category</div>
              <div className="mt-4 space-y-3">
                <Link
                  href={buildProductsHref(undefined, voltage, 1)}
                  className={`flex items-center gap-3 text-sm ${
                    !categorySlug ? "font-semibold text-brand-blue" : "text-slate-700"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border ${!categorySlug ? "border-brand-blue bg-brand-blue ring-2 ring-brand-blue/20" : "border-slate-400 bg-white"}`} />
                  All
                </Link>
                {categories.map((category) => {
                  const isActive = category.slug === categorySlug;

                  return (
                    <Link
                      key={category.id}
                      href={buildProductsHref(category.slug, voltage, 1)}
                      className={`flex items-center gap-3 text-sm ${
                        isActive ? "font-semibold text-brand-blue" : "text-slate-700"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full border ${isActive ? "border-brand-blue bg-brand-blue ring-2 ring-brand-blue/20" : "border-slate-400 bg-slate-700"}`} />
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm font-semibold text-slate-900">Price Range</div>
              <PriceRangeFilter
                catalogMax={catalogMax}
                activeMin={activeMinPrice}
                activeMax={activeMaxPrice}
              />
            </div>

            <div className="mt-8">
              <div className="text-sm font-semibold text-slate-900">Voltage</div>
              <div className="mt-4 space-y-3">
                <Link
                  href={buildProductsHref(categorySlug, undefined, 1)}
                  className={`flex items-center gap-3 text-sm ${
                    !voltage ? "font-semibold text-brand-blue" : "text-slate-700"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border ${!voltage ? "border-brand-blue bg-brand-blue ring-2 ring-brand-blue/20" : "border-slate-400 bg-white"}`} />
                  All Voltages
                </Link>
                {voltageOptions.length ? (
                  voltageOptions.map((option) => {
                    const isActive = option === voltage;

                    return (
                      <Link
                        key={option}
                        href={buildProductsHref(categorySlug, option, 1)}
                        className={`flex items-center gap-3 text-sm ${
                          isActive ? "font-semibold text-brand-blue" : "text-slate-700"
                        }`}
                      >
                        <span className={`h-3 w-3 rounded-full border ${isActive ? "border-brand-blue bg-brand-blue ring-2 ring-brand-blue/20" : "border-slate-400 bg-white"}`} />
                        {option}
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-500">No voltage data available.</div>
                )}
              </div>
            </div>

            <InStockFilter active={inStock} />
          </aside>

          <section>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => {
                const cartItem = {
                  id: product.id,
                  type: "product",
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  category: product.category
                };

                return (
                  <article
                    key={product.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)]"
                  >
                    <div className="relative">
                      <Link href={`/products/${product.slug}`} className="relative block h-56 overflow-hidden bg-slate-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          className="object-cover"
                        />
                      </Link>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
                        <Link
                          href={`/products/${product.slug}`}
                          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-brand-blue bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-[0_12px_28px_rgba(37,99,235,0.2)] transition hover:bg-brand-blue hover:text-white"
                        >
                          <Icon name="eye" className="h-4 w-4" />
                          Quick View
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-brand-blue">
                        {product.category}
                      </div>
                      {product.voltage ? (
                        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          {product.voltage}
                        </div>
                      ) : null}
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-2 block line-clamp-2 text-base font-semibold leading-snug tracking-tight text-slate-900 transition-colors hover:text-brand-blue"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>In stock</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <div className="text-lg font-bold tracking-tight text-brand-blue">
                          ${product.price.toFixed(2)}
                        </div>
                        <AddToCartButton item={cartItem} className="button-primary px-3 py-1.5 text-[10px] whitespace-nowrap" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!products.length ? (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No products matched the current filters{search ? ` for "${search}".` : "."}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                {page > 1 ? (
                  <Link
                    href={buildProductsHref(categorySlug, voltage, page - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue"
                  >
                    ‹
                  </Link>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-sm text-slate-300">‹</span>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span>
                    ) : (
                      <Link
                        key={item}
                        href={buildProductsHref(categorySlug, voltage, item)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition ${
                          item === page
                            ? "border-brand-blue bg-brand-blue text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-blue hover:text-brand-blue"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}
                {page < totalPages ? (
                  <Link
                    href={buildProductsHref(categorySlug, voltage, page + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue"
                  >
                    ›
                  </Link>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-sm text-slate-300">›</span>
                )}
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
