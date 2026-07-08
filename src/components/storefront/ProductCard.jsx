import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/storefront/AddToCartButton";

export default function ProductCard({ item }) {
  const categoryName = typeof item.category === "string" ? item.category : item.category?.name || "Components";
  const detailHref = `/products/${item.slug}`;
  const cartItem = {
    id: item.id,
    type: "product",
    productId: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image,
    category: categoryName
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
      <Link
        href={detailHref}
        className="relative block h-56 cursor-pointer overflow-hidden"
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
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="badge-pill badge-blue">
            {categoryName}
          </span>
          {item.badge ? (
            <span className="badge-pill badge-orange">
              {item.badge}
            </span>
          ) : null}
        </div>
        <Link href={detailHref} className="block min-w-0 font-display text-base font-semibold leading-snug text-slate-900 transition-colors hover:text-brand-blue" title={item.name}>
          <span className="line-clamp-2 break-words">
          {item.name}
          </span>
        </Link>
        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{item.description}</p>
        {item.voltage ? (
          <div className="mt-3">
            <span className="badge-pill badge-emerald">{item.voltage}</span>
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="text-lg font-bold tracking-tight text-brand-blue">${item.price.toFixed(2)}</div>
          </div>
          <AddToCartButton item={cartItem} />
        </div>
      </div>
    </article>
  );
}
