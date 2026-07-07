import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import Icon from "@/components/common/Icon";
import SearchFilters from "@/components/storefront/SearchFilters";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { listStorefrontCategories, listStorefrontProducts } from "@/services/productService";
import { listStorefrontRobotKits } from "@/services/robotKitService";

function normalizeQuery(value) {
  return String(value || "").trim();
}

function ProductResultCard({ product }) {
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)]">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="relative block h-56 overflow-hidden bg-slate-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
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
          className="mt-3 block min-h-[3.5rem] text-xl font-semibold leading-7 tracking-tight text-slate-900"
        >
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm text-slate-500">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="text-xl font-bold tracking-tight text-brand-blue">${product.price.toFixed(2)}</div>
          <AddToCartButton item={cartItem} className="button-primary px-3 py-1.5 text-[10px] whitespace-nowrap" />
        </div>
      </div>
    </article>
  );
}

function RobotKitResultCard({ kit }) {
  const stockQuantity = Number(kit.stockQuantity || 0);
  const cartItem = {
    id: kit.id,
    type: "robotKit",
    robotKitId: kit.id,
    slug: kit.slug,
    name: kit.name,
    price: kit.price,
    image: kit.image,
    category: "Robot Kits"
  };

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="relative h-64 overflow-hidden bg-slate-100">
        <Image
          src={kit.image}
          alt={kit.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {kit.level}
        </span>
      </div>
      <div className="p-5">
        <Link href="/robot-kits" className="block text-2xl font-semibold leading-tight tracking-tight text-slate-900">
          {kit.name}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm text-slate-500">{kit.description}</p>
        <div className={`mt-3 text-xs font-semibold ${stockQuantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {stockQuantity > 0 ? `In Stock (${stockQuantity} available)` : "Out of Stock"}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-2xl font-bold tracking-tight text-brand-blue">${kit.price.toFixed(2)}</div>
          <AddToCartButton
            item={cartItem}
            className="button-primary px-4 py-2.5 text-xs"
            disabled={stockQuantity <= 0}
          />
        </div>
      </div>
    </article>
  );
}

export default async function SearchPage({ searchParams }) {
  const query = normalizeQuery(searchParams?.q);
  const activeCategory = String(searchParams?.category || "");
  const activeInStock = searchParams?.inStock === "true";
  const activeMinPrice = Number(searchParams?.minPrice) || undefined;
  const activeMaxPrice = Number(searchParams?.maxPrice) || undefined;

  const [rawCategories, products, robotKits] = await Promise.all([
    listStorefrontCategories(),
    query
      ? listStorefrontProducts(activeCategory || undefined, undefined, query, activeMaxPrice, activeMinPrice, activeInStock || undefined)
      : Promise.resolve([]),
    query ? listStorefrontRobotKits(undefined, query) : Promise.resolve([])
  ]);

  const filterCategories = rawCategories.map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug }));
  const totalResults = products.length + robotKits.length;

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
            <li className="font-medium text-slate-800">Search</li>
          </ol>
        </nav>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-mist p-3 text-brand-blue">
              <Icon name="search" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Store Search</h1>
              {query ? (
                <p className="mt-3 text-base text-slate-500">
                  {totalResults} result{totalResults === 1 ? "" : "s"} for <span className="font-semibold text-slate-900">&quot;{query}&quot;</span>
                </p>
              ) : (
                <p className="mt-3 text-base text-slate-500">
                  Search products and robot kits from the storefront.
                </p>
              )}
            </div>
          </div>
        </section>

        {!query ? (
          <section className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
            Enter a search term in the navbar to find products and robot kits.
          </section>
        ) : (
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="w-full flex-none lg:w-60">
              <Suspense>
                <SearchFilters
                  categories={filterCategories}
                  activeCategory={activeCategory}
                  activeInStock={activeInStock}
                  activeMinPrice={activeMinPrice}
                  activeMaxPrice={activeMaxPrice}
                />
              </Suspense>
            </aside>

            <div className="min-w-0 flex-1">
              {!totalResults ? (
                <section className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  No products or robot kits matched <span className="font-semibold text-slate-700">&quot;{query}&quot;</span>.
                </section>
              ) : null}

              {products.length ? (
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="heading-card">Products</h2>
                    <Link href={`/products?search=${encodeURIComponent(query)}`} className="text-sm font-semibold text-brand-blue hover:text-brand-blue/80">
                      View product results
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <ProductResultCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ) : null}

              {robotKits.length ? (
                <section className={products.length ? "mt-10" : ""}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="heading-card">Robot Kits</h2>
                    <Link href={`/robot-kits?search=${encodeURIComponent(query)}`} className="text-sm font-semibold text-brand-blue hover:text-brand-blue/80">
                      View kit results
                    </Link>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {robotKits.map((kit) => (
                      <RobotKitResultCard key={kit.id} kit={kit} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
