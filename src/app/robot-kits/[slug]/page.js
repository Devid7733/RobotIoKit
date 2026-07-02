import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getStorefrontRobotKitBySlug } from "@/services/robotKitService";

export const dynamic = "force-dynamic";

const levelBadgeClass = {
  Beginner: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-rose-100 text-rose-700"
};

const levelDotCount = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};

const ageByLevel = {
  Beginner: "Age 10+",
  Intermediate: "Age 12+",
  Advanced: "Age 14+"
};

function LevelDots({ level }) {
  const activeDots = levelDotCount[level] || 1;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={`h-2.5 w-2.5 rounded-full ${dot < activeDots ? "bg-brand-orange" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

export async function generateMetadata({ params }) {
  const kit = await getStorefrontRobotKitBySlug(params.slug);
  if (!kit) {
    return { title: "Kit Not Found | RobotIoKit" };
  }
  return {
    title: `${kit.name} | RobotIoKit`,
    description: kit.description
  };
}

export default async function RobotKitDetailPage({ params }) {
  const kit = await getStorefrontRobotKitBySlug(params.slug);

  if (!kit) {
    notFound();
  }

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
              <Link href="/robot-kits" className="hover:text-brand-blue">
                Robot Kits
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-slate-800">{kit.name}</li>
          </ol>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1fr,0.95fr]">
          <div className="relative h-[22rem] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:h-[36rem]">
            {kit.image ? (
              <Image
                src={kit.image}
                alt={kit.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass[kit.level] || levelBadgeClass.Beginner}`}
              >
                {kit.level}
              </span>
              <span className="text-sm text-slate-500">{ageByLevel[kit.level] || "Age 10+"}</span>
              <LevelDots level={kit.level} />
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-900">
              {kit.name}
            </h1>

            <div className="mt-4 text-5xl font-bold tracking-tight text-brand-blue">
              ${kit.price.toFixed(2)}
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {kit.description}
            </p>

            {kit.sku && (
              <p className="mt-3 text-xs text-slate-400">
                SKU: {kit.sku}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              <span className={`rounded-full px-3 py-1 font-medium ${stockQuantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {stockQuantity > 0 ? `In Stock (${stockQuantity} available)` : "Out of Stock"}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <AddToCartButton
                item={cartItem}
                className="button-primary px-8 py-3.5 text-sm"
                disabled={stockQuantity <= 0}
              />
              <Link
                href="/robot-kits"
                className="rounded-[20px] border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to Kits
              </Link>
            </div>

            <div className="mt-8 rounded-[16px] border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">What&apos;s included</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  All required components and parts
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Step-by-step assembly manual
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  Access to online tutorials and support
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
