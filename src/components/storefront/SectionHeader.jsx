import Link from "next/link";

export default function SectionHeader({ eyebrow, title, description, actionHref, actionLabel }) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="eyebrow-text">{eyebrow}</p>
        ) : null}
        <h2 className="mt-3 heading-section">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="badge-soft badge-blue hover:bg-brand-blue/15">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
