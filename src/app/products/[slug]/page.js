import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProductPurchasePanel from "@/components/storefront/ProductPurchasePanel";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { AlsoBoughtSkeleton, RelatedProductsSkeleton } from "@/components/ui/skeletons";
import {
  getAlsoBoughtProducts,
  getCompatibleProducts,
  getStorefrontProductBySlug,
  listProductSlugs
} from "@/services/productService";

export const revalidate = 60;

// Required for ISR on a dynamic segment: without generateStaticParams, Next.js
// treats this route as fully dynamic (revalidate alone has no effect). Returning
// every slug here pre-renders each product page at build time and keeps them
// cached/revalidated afterward; a slug added later still generates on-demand.
export async function generateStaticParams() {
  const products = await listProductSlugs();
  return products.map(({ slug }) => ({ slug }));
}

function buildGallery(product) {
  return [product.image, product.image, product.image, product.image];
}

function categoryHref(categoryName) {
  return `/products?category=${String(categoryName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

async function AlsoBoughtProducts({ productId }) {
  const products = await getAlsoBoughtProducts(productId, 4);
  if (!products.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">Customers Also Bought</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium text-brand-blue">{product.category}</div>
              <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-blue">
                {product.name}
              </div>
              <div className="mt-1 text-base font-bold tracking-tight text-brand-blue">
                ${product.price.toFixed(2)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function CompatibleProducts({ productSlug }) {
  const products = await getCompatibleProducts(productSlug, 8);
  if (!products.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">Works Well With</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)]"
          >
            <div className="relative h-44 overflow-hidden bg-slate-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-brand-blue">{product.category}</span>
                {product.voltages?.map((voltage) => (
                  <span key={voltage} className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                    {voltage}
                  </span>
                ))}
              </div>
              <div className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-blue">
                {product.name}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(product.compatibilityReasons || []).map((reason) => (
                  <span key={reason} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {reason}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-4 text-lg font-bold tracking-tight text-brand-blue">
                ${product.price.toFixed(2)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found | RobotIoKit" };
  }
  return {
    title: `${product.name} | RobotIoKit`,
    description: product.description
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const gallery = buildGallery(product);

  return (
    <StorefrontShell>
      <div className="storefront-container py-6 sm:py-8">
        <nav className="mb-6 text-xs text-slate-500 sm:text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-blue">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-brand-blue">
                Products
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={categoryHref(product.category)} className="hover:text-brand-blue">
                {product.category}
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-slate-800">{product.name}</li>
          </ol>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1fr,0.95fr]">
          <div>
            <div className="relative h-[22rem] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:h-[30rem]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative h-16 overflow-hidden rounded-xl border border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.05)] sm:h-20"
                >
                  <Image src={image} alt={`${product.name} thumbnail ${index + 1}`} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-brand-blue">
              {product.category}
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 text-4xl font-bold tracking-tight text-brand-blue sm:text-5xl">
              ${product.price.toFixed(2)}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                In Stock ({product.stock} units)
              </span>
              {product.voltage ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  Voltage: {product.voltage}
                </span>
              ) : null}
              <span className="rounded-full bg-fuchsia-50 px-3 py-1 font-medium text-fuchsia-700">
                Protocol: {product.specifications.find((spec) => spec.label.toLowerCase().includes("connectivity") || spec.label.toLowerCase().includes("interface"))?.value || "USB / UART"}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                Connectivity: {product.sku ? "USB Type-B" : "Project Ready"}
              </span>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {product.overview}
            </p>

            <ProductPurchasePanel product={product} />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-200 px-5 py-4 text-lg font-semibold text-slate-900">
            Technical Specifications
          </div>
          <div className="divide-y divide-slate-200">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[240px,1fr]">
                <div className="text-slate-500">{spec.label}</div>
                <div className="font-medium text-slate-900">{spec.value}</div>
              </div>
            ))}
          </div>
        </section>

        <Suspense fallback={<AlsoBoughtSkeleton />}>
          <AlsoBoughtProducts productId={product.id} />
        </Suspense>

        <Suspense fallback={<RelatedProductsSkeleton />}>
          <CompatibleProducts productSlug={product.slug} />
        </Suspense>
      </div>
    </StorefrontShell>
  );
}
