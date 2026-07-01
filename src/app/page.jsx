import { Suspense } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import KitCard from "@/components/storefront/KitCard";
import ProductCard from "@/components/storefront/ProductCard";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { listHomeCategories, listFeaturedStorefrontProducts, listNewArrivalsProducts } from "@/services/productService";
import { getFeaturedRobotKits, getHeroStats } from "@/lib/storefrontQueries";
import {
  HeroStatsSkeleton,
  CategoryGridSkeleton,
  KitGridSkeleton,
  ProductGridSkeleton
} from "@/components/ui/skeletons";

const supportCards = [
  { title: "Genuine Components", description: "Authentic parts from trusted robotics suppliers.", icon: "checkCircle" },
  { title: "Fast Delivery", description: "Delivery and pickup flow ready for Phnom Penh customers.", icon: "store" },
  { title: "Technical Support", description: "Starter guidance for students, makers, and lab projects.", icon: "user" },
  { title: "Wide Selection", description: "Browse live inventory across controllers, sensors, motors, and kits.", icon: "cube" }
];

const categoryAccent = [
  "bg-blue-100 text-brand-blue",
  "bg-fuchsia-100 text-fuchsia-500",
  "bg-amber-100 text-amber-500",
  "bg-emerald-100 text-emerald-500",
  "bg-orange-100 text-orange-500",
  "bg-rose-100 text-rose-500"
];

// ─── Async streaming sub-components ──────────────────────────────────────────

async function HomeHeroStats() {
  const heroStats = await getHeroStats();
  return (
    <div className="mt-12 grid max-w-2xl grid-cols-2 gap-5 sm:grid-cols-4">
      {heroStats.map((item) => (
        <div key={item.label}>
          <div className="text-3xl font-bold tracking-tight text-white">{item.value}</div>
          <div className="mt-1 text-sm text-slate-300">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

async function HomeCategories() {
  const categories = await listHomeCategories(6);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={category.href}
          className="rounded-[22px] border border-slate-200 bg-white p-5 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
        >
          <div className={`mx-auto inline-flex rounded-2xl p-3 ${categoryAccent[index % categoryAccent.length]}`}>
            <Icon name={category.icon} className="h-5 w-5" />
          </div>
          <div className="mt-4 text-sm font-medium text-slate-900">{category.name}</div>
        </Link>
      ))}
    </div>
  );
}

async function HomeFeaturedKits() {
  const kits = await getFeaturedRobotKits(3);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {kits.map((kit) => (
        <KitCard key={kit.id} item={kit} />
      ))}
    </div>
  );
}

async function HomeNewArrivals() {
  const products = await listNewArrivalsProducts(6);
  if (!products.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} item={product} />
      ))}
    </div>
  );
}

async function HomeFeaturedProducts() {
  const products = await listFeaturedStorefrontProducts(8);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} item={product} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message || "";

  return (
    <StorefrontShell>
      {message ? (
        <div className="bg-rose-50">
          <div className="storefront-container py-3">
            <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700">
              {message}
            </div>
          </div>
        </div>
      ) : null}
      <section
        className="relative overflow-hidden bg-brand-dark text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(13, 21, 42, 0.96) 0%, rgba(13, 21, 42, 0.85) 42%, rgba(37, 99, 235, 0.38) 100%), url(https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_28rem)]" />
        <div className="storefront-container relative py-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-slate-100 backdrop-blur sm:text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              In Stock &amp; Ready to Ship
            </div>
            <h1 className="mt-7 max-w-xl font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              Build the Future with <span className="text-brand-orange">RobotIoKit</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
              Your one-stop shop for robotics components, development boards, sensors, motors, and complete
              robot kits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="button-primary gap-2 px-6 py-3.5 text-sm sm:px-7 sm:text-base">
                Shop Components
                <Icon name="arrowRight" className="h-5 w-5" />
              </Link>
              <Link
                href="/robot-kits"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15 sm:px-7 sm:text-base"
              >
                View Robot Kits
              </Link>
            </div>
            <Suspense fallback={<HeroStatsSkeleton />}>
              <HomeHeroStats />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="storefront-container">
          <div className="grid gap-px border-x border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {supportCards.map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="mt-0.5 inline-flex rounded-full bg-blue-50 p-2.5 text-brand-blue">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="storefront-container">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Shop by Category</h2>
              <p className="mt-2 text-sm text-slate-500">Browse components by type</p>
            </div>
            <Link href="/products" className="button-blue rounded-full px-5 py-2.5 text-sm">
              View All
            </Link>
          </div>
          <Suspense fallback={<CategoryGridSkeleton count={6} />}>
            <HomeCategories />
          </Suspense>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="storefront-container">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Featured Robot Kits</h2>
              <p className="mt-2 text-sm text-slate-500">Curated for students, makers, and lab projects</p>
            </div>
            <Link href="/robot-kits" className="button-blue rounded-full px-5 py-2.5 text-sm">
              All Kits
            </Link>
          </div>
          <Suspense fallback={<KitGridSkeleton count={3} />}>
            <HomeFeaturedKits />
          </Suspense>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="storefront-container">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">New Arrivals</h2>
              <p className="mt-2 text-sm text-slate-500">The latest components added to our inventory</p>
            </div>
            <Link href="/products" className="button-blue rounded-full px-5 py-2.5 text-sm">
              View All
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={3} />}>
            <HomeNewArrivals />
          </Suspense>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="storefront-container">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Featured Products</h2>
              <p className="mt-2 text-sm text-slate-500">Top picks from our robotics inventory</p>
            </div>
            <Link href="/products" className="button-blue rounded-full px-5 py-2.5 text-sm">
              All Products
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <HomeFeaturedProducts />
          </Suspense>
          <div className="mt-8 text-center">
            <Link href="/products" className="button-blue px-7 py-3">
              Browse All Components
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="storefront-container">
          <div className="surface-card-dark rounded-[20px] px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-2xl font-semibold tracking-tight">Ready to Start Building?</div>
                <p className="mt-2 max-w-3xl text-sm text-blue-100">
                  Explore our full robotics inventory and complete kits. Free in-store pickup available at our Phnom Penh shop.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="button-primary px-6 py-3">
                  Shop Now
                </Link>
                <Link
                  href="/robot-kits"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Kits
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
