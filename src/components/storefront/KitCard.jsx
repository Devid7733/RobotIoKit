import Image from "next/image";
import Link from "next/link";

export default function KitCard({ item }) {
  const detailHref = item.slug ? `/robot-kits/${item.slug}` : `/robot-kits/${item.id}`;
  const stockQuantity = Number(item.stockQuantity || 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
      <Link
        href={detailHref}
        className="relative block h-64 cursor-pointer overflow-hidden"
        aria-label={`View ${item.name}`}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="badge-pill badge-level-beginner">
            {item.level || "Beginner"}
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-blue">${item.price.toFixed(2)}</span>
        </div>
        <Link href={detailHref} className="block min-w-0 text-slate-900 transition-colors hover:text-brand-blue" title={item.name}>
          <h3 className="line-clamp-2 font-display text-xl font-semibold leading-7">
            {item.name}
          </h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">{item.description}</p>
        <div className={`mt-4 text-xs font-semibold ${stockQuantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {stockQuantity > 0 ? `In Stock (${stockQuantity} available)` : "Out of Stock"}
        </div>
        <div className="mt-auto pt-6">
          <Link href={detailHref} className="button-primary w-full">
            View Kit
          </Link>
        </div>
      </div>
    </article>
  );
}
