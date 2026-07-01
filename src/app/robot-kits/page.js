import Link from "next/link";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import PriceRangeFilter from "@/components/storefront/PriceRangeFilter";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { listStorefrontRobotKits } from "@/services/robotKitService";

const difficultyTabs = ["All", "Beginner", "Intermediate", "Advanced"];

const ageByLevel = {
  Beginner: "Age 10+",
  Intermediate: "Age 12+",
  Advanced: "Age 14+"
};

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

export default async function RobotKitsPage({ searchParams }) {
  const level = searchParams?.level;
  const search = String(searchParams?.search || "").trim() || undefined;
  const maxPrice = Number(searchParams?.maxPrice);
  const activeMaxPrice = Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null;
  const minPrice = Number(searchParams?.minPrice);
  const activeMinPrice = Number.isFinite(minPrice) && minPrice > 0 ? minPrice : null;
  const activeLevel = difficultyTabs.includes(level) && level !== "All" ? level : null;
  const [allRobotKits, visibleRobotKits] = await Promise.all([
    listStorefrontRobotKits(undefined, search),
    listStorefrontRobotKits(undefined, search, activeLevel, activeMinPrice, activeMaxPrice)
  ]);
  const catalogMax = Math.max(
    200,
    Math.ceil(Math.max(...allRobotKits.map((kit) => Number(kit.price)), 0) / 10) * 10
  );
  const skillLevels = new Set(visibleRobotKits.map((kit) => kit.level).filter(Boolean)).size || 1;
  const startingAge = visibleRobotKits.some((kit) => kit.level === "Beginner") ? "Age 10+" : "Age 12+";

  function buildRobotKitsHref(nextLevel, nextMaxPrice, nextMinPrice) {
    const query = new URLSearchParams();

    if (nextLevel) {
      query.set("level", nextLevel);
    }

    if (nextMinPrice) {
      query.set("minPrice", String(nextMinPrice));
    }

    if (nextMaxPrice) {
      query.set("maxPrice", String(nextMaxPrice));
    }

    if (search) {
      query.set("search", search);
    }

    const queryString = query.toString();
    return queryString ? `/robot-kits?${queryString}` : "/robot-kits";
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
            <li className="font-medium text-slate-800">Robot Kits</li>
          </ol>
        </nav>

        <section>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900">
            Robot Kits
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-500">
            Complete robotics kits for all skill levels from beginners to advanced builders.
          </p>
          {search ? (
            <p className="mt-3 text-base text-slate-500">
              Showing search results for <span className="font-semibold text-slate-900">&quot;{search}&quot;</span>.
            </p>
          ) : null}
        </section>

        <section className="mt-8 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">Difficulty:</span>
              {difficultyTabs.map((tab) => {
                const isActive = (tab === "All" && !activeLevel) || tab === activeLevel;

                return (
                  <Link
                    key={tab}
                    href={buildRobotKitsHref(tab === "All" ? null : tab, activeMaxPrice, activeMinPrice)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {tab}
                  </Link>
                );
              })}
            </div>
            <div className="min-w-[16rem] text-sm text-slate-500">
              <div className="font-semibold text-slate-600">Price Range</div>
              <PriceRangeFilter
                catalogMax={catalogMax}
                activeMin={activeMinPrice}
                activeMax={activeMaxPrice}
              />
              <div className="mt-2 text-sm text-slate-500">{visibleRobotKits.length} kits found</div>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-[26px] bg-[linear-gradient(90deg,#2563eb_0%,#4338ca_55%,#4f46e5_100%)] px-6 py-6 text-white shadow-[0_22px_44px_rgba(37,99,235,0.2)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[1.75rem] font-semibold tracking-tight">
                All kits include assembly instructions & components
              </h2>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                Each kit comes with a detailed manual, all required parts, and access to online tutorials.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold leading-none">{visibleRobotKits.length}</div>
                <div className="mt-1 text-sm text-blue-100">Kits Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold leading-none">{skillLevels}</div>
                <div className="mt-1 text-sm text-blue-100">Skill Levels</div>
              </div>
              <div>
                <div className="text-4xl font-bold leading-none">{startingAge}</div>
                <div className="mt-1 text-sm text-blue-100">Starting Age</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {visibleRobotKits.map((kit) => {
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
              <article
                key={kit.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="relative">
                  <Link
                    href={`/robot-kits/${kit.slug}`}
                    className="block h-80 cursor-pointer bg-slate-100 bg-cover bg-center transition duration-300 hover:scale-[1.01]"
                    style={{ backgroundImage: `url(${kit.image})` }}
                    aria-label={`View ${kit.name}`}
                  />
                  <span
                    className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass[kit.level] || levelBadgeClass.Beginner}`}
                  >
                    {kit.level}
                  </span>
                </div>
                <div className="p-5">
                  <Link href={`/robot-kits/${kit.slug}`} className="block min-w-0 text-slate-900 transition-colors hover:text-brand-blue" title={kit.name}>
                    <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight">
                      {kit.name}
                    </h3>
                  </Link>
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
                    <span>{ageByLevel[kit.level] || "Age 10+"}</span>
                    <LevelDots level={kit.level} />
                  </div>
                  <div className={`mt-3 text-xs font-semibold ${stockQuantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {stockQuantity > 0 ? `In Stock (${stockQuantity} available)` : "Out of Stock"}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-xl font-bold tracking-tight text-brand-blue">
                      ${kit.price.toFixed(2)}
                    </div>
                    <AddToCartButton
                      item={cartItem}
                      className="button-primary px-4 py-2.5 text-xs"
                      disabled={stockQuantity <= 0}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        {!visibleRobotKits.length ? (
          <section className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
            No robot kits matched the current filters{search ? ` for "${search}".` : "."}
          </section>
        ) : null}
      </div>
    </StorefrontShell>
  );
}
