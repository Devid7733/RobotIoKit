function Pulse({ className = "" }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

// ─── Card skeletons ───────────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="h-56 animate-pulse bg-slate-200" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Pulse className="h-5 w-20 rounded-full" />
        <Pulse className="h-6 w-full" />
        <Pulse className="h-6 w-3/4" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Pulse className="h-7 w-16" />
          <Pulse className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function KitCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="h-64 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <Pulse className="h-7 w-3/4" />
        <div className="flex items-center gap-3">
          <Pulse className="h-4 w-16" />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Pulse className="h-8 w-20" />
          <Pulse className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function KitGridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <KitCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="mx-auto h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
      <Pulse className="mx-auto mt-4 h-4 w-20" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function HeroStatsSkeleton() {
  return (
    <div className="mt-12 grid max-w-2xl grid-cols-2 gap-5 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-9 w-16 animate-pulse rounded bg-white/20" />
          <div className="mt-1 h-4 w-14 animate-pulse rounded bg-white/20" />
        </div>
      ))}
    </div>
  );
}

// ─── Also bought ──────────────────────────────────────────────────────────────

export function AlsoBoughtSkeleton() {
  return (
    <section className="mt-10">
      <Pulse className="h-6 w-52" />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Related products ─────────────────────────────────────────────────────────

export function RelatedProductsSkeleton() {
  return (
    <section className="mt-10">
      <Pulse className="h-6 w-40" />
      <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrderTableRowSkeleton() {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.045)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.25fr,0.8fr,0.9fr,auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Pulse className="h-6 w-24" />
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <Pulse className="mt-3 h-4 w-36" />
        </div>
        <div>
          <Pulse className="h-3 w-14" />
          <div className="mt-3 flex items-center gap-2">
            <Pulse className="h-8 w-24 rounded-full" />
            <Pulse className="h-4 w-20" />
          </div>
        </div>
        <div>
          <Pulse className="h-3 w-12" />
          <Pulse className="mt-3 h-8 w-24" />
          <Pulse className="mt-2 h-4 w-40" />
        </div>
        <Pulse className="h-11 w-full rounded-2xl lg:w-36" />
      </div>
    </div>
  );
}

export function OrderTableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <OrderTableRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────

export function AccountStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface-card-muted">
          <Pulse className="h-3 w-16" />
          <Pulse className="mt-2 h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Full-page skeletons (used in loading.js) ─────────────────────────────────

export function ProductsPageSkeleton() {
  return (
    <div className="storefront-container py-8 sm:py-10">
      <div className="mb-7 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-20" />
      </div>
      <Pulse className="h-10 w-48" />
      <Pulse className="mt-3 h-5 w-32" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px,1fr] xl:grid-cols-[300px,1fr]">
        <div className="h-fit space-y-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <Pulse className="h-8 w-24" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Pulse key={i} className="h-5 w-full" />)}
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-5 w-full" />)}
          </div>
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}

export function RobotKitsPageSkeleton() {
  return (
    <div className="storefront-container py-8 sm:py-10">
      <div className="mb-7 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-24" />
      </div>
      <Pulse className="h-10 w-36" />
      <Pulse className="mt-4 h-6 w-80" />
      <div className="mt-8 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <Pulse className="h-5 w-20" />
          {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-9 w-24 rounded-2xl" />)}
        </div>
      </div>
      <Pulse className="mt-7 h-32 w-full rounded-[26px]" />
      <div className="mt-8">
        <KitGridSkeleton count={3} />
      </div>
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="storefront-container page-section">
      <div className="mb-4 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-24" />
      </div>
      <section className="page-hero">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-10 w-64" />
            <Pulse className="h-5 w-96 max-w-full" />
          </div>
          <AccountStatsSkeleton />
        </div>
      </section>
      <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr,1.08fr]">
        <div className="section-card space-y-4">
          <Pulse className="h-7 w-32" />
          {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-12 w-full rounded-2xl" />)}
        </div>
        <div className="section-card space-y-4">
          <Pulse className="h-7 w-32" />
          {[0, 1, 2].map((i) => <Pulse key={i} className="h-24 w-full rounded-[24px]" />)}
        </div>
      </div>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="storefront-container page-section">
      <div className="mb-4 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-24" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        <Pulse className="h-4 w-24" />
        <Pulse className="h-10 w-40" />
        <Pulse className="h-5 w-32" />
      </div>
      <div className="mt-8">
        <OrderTableSkeleton rows={5} />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="storefront-container py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-4 w-20" />)}
      </div>
      <section className="grid gap-8 lg:grid-cols-[1fr,0.95fr]">
        <div>
          <div className="h-[22rem] animate-pulse rounded-[18px] bg-slate-200 sm:h-[30rem]" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 sm:h-20" />
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-1">
          <Pulse className="h-5 w-24 rounded-full" />
          <Pulse className="h-10 w-full" />
          <Pulse className="h-10 w-3/4" />
          <Pulse className="h-14 w-32" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => <Pulse key={i} className="h-6 w-24 rounded-full" />)}
          </div>
          <div className="space-y-2 pt-2">
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-3/4" />
          </div>
        </div>
      </section>
      <div className="mt-8 overflow-hidden rounded-[16px] border border-slate-200 bg-white">
        <Pulse className="h-14 w-full rounded-none" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-slate-200 px-5 py-4">
            <Pulse className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RobotKitDetailSkeleton() {
  return (
    <div className="storefront-container py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-4 w-20" />)}
      </div>
      <section className="grid gap-8 lg:grid-cols-[1fr,0.95fr]">
        <div className="h-[22rem] animate-pulse rounded-[18px] border border-slate-200 bg-slate-200 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:h-[36rem]" />
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pulse className="h-7 w-24 rounded-full" />
            <Pulse className="h-5 w-16" />
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
          <Pulse className="h-10 w-full" />
          <Pulse className="h-10 w-4/5" />
          <Pulse className="h-14 w-32" />
          <div className="space-y-2 pt-2">
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-3/4" />
          </div>
          <Pulse className="h-7 w-32 rounded-full" />
          <div className="flex flex-wrap gap-4 pt-3">
            <Pulse className="h-12 w-36 rounded-[20px]" />
            <Pulse className="h-12 w-32 rounded-[20px]" />
          </div>
          <div className="mt-8 rounded-[16px] border border-slate-100 bg-slate-50 p-5">
            <Pulse className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <Pulse key={i} className="h-4 w-full" />)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="storefront-container py-8 sm:py-10">
      <div className="mb-7 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-16" />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-4">
          <Pulse className="h-12 w-12 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Pulse className="h-10 w-52" />
            <Pulse className="h-5 w-72 max-w-full" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Pulse className="h-8 w-32" />
          <Pulse className="h-5 w-28" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Pulse className="h-8 w-32" />
          <Pulse className="h-5 w-24" />
        </div>
        <KitGridSkeleton count={3} />
      </section>
    </div>
  );
}

function CartItemSkeleton() {
  return (
    <div className="surface-outline flex flex-col gap-4 bg-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Pulse className="h-20 w-20 rounded-2xl" />
        <div className="space-y-2">
          <Pulse className="h-5 w-48 max-w-[55vw]" />
          <Pulse className="h-4 w-24" />
          <Pulse className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Pulse className="h-10 w-28 rounded-2xl" />
        <Pulse className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="storefront-container page-section">
      <div className="mb-4 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-12" />
      </div>
      <div className="grid gap-8 xl:grid-cols-[1fr,360px]">
        <section className="space-y-4">
          <div className="space-y-3">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-10 w-36" />
            <Pulse className="h-5 w-48" />
          </div>
          {[0, 1, 2].map((i) => <CartItemSkeleton key={i} />)}
        </section>
        <aside className="section-card h-fit">
          <Pulse className="h-8 w-36" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Pulse className="mt-6 h-12 w-full rounded-2xl" />
          <Pulse className="mt-4 h-4 w-48 max-w-full" />
        </aside>
      </div>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="storefront-container page-section">
      <div className="mb-4 flex gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-10" />
        <Pulse className="h-4 w-2" />
        <Pulse className="h-4 w-20" />
      </div>
      <div className="grid gap-8 xl:grid-cols-[1fr,380px]">
        <section className="space-y-6">
          <div className="space-y-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-10 w-40" />
          </div>
          {[0, 1, 2].map((section) => (
            <div key={section} className="section-card">
              <Pulse className="h-8 w-48" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-12 w-full rounded-2xl" />)}
              </div>
            </div>
          ))}
          <Pulse className="h-24 w-full rounded-2xl" />
        </section>
        <aside className="section-card h-fit">
          <Pulse className="h-8 w-40" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Pulse className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Pulse className="h-4 w-28" />
                    <Pulse className="h-3 w-10" />
                  </div>
                </div>
                <Pulse className="h-5 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-8 w-full" />
          </div>
          <Pulse className="mt-6 h-14 w-full rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}

export function KhqrPaymentPageSkeleton() {
  return (
    <div className="storefront-container page-section flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-5xl">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <Pulse className="mx-auto h-4 w-32" />
          <Pulse className="mx-auto h-10 w-56" />
          <Pulse className="mx-auto h-5 w-full" />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white shadow-[0_22px_55px_rgba(15,23,42,0.16)]">
            <div className="bg-red-600 px-6 py-4">
              <Pulse className="mx-auto h-6 w-20 bg-white/30" />
            </div>
            <div className="px-7 py-6">
              <Pulse className="h-4 w-32" />
              <Pulse className="mt-2 h-12 w-36" />
              <div className="my-6 border-t border-dashed border-slate-200" />
              <Pulse className="mx-auto h-64 w-64" />
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <Pulse className="h-4 w-24" />
                  <Pulse className="h-4 w-28" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <Pulse className="h-4 w-16" />
                  <Pulse className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>

          <div className="section-card h-fit">
            <Pulse className="h-8 w-72 max-w-full" />
            <div className="mt-4 space-y-2">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-4/5" />
            </div>
            <Pulse className="mt-5 h-20 w-full rounded-2xl" />
            <Pulse className="mt-6 h-20 w-full rounded-2xl" />
            <Pulse className="mt-3 h-14 w-full rounded-2xl" />
            <Pulse className="mx-auto mt-3 h-5 w-44" />
          </div>
        </div>
      </section>
    </div>
  );
}
