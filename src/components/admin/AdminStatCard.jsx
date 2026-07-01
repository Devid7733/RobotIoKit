const toneClasses = {
  blue: "bg-brand-blue/10 text-brand-blue",
  orange: "bg-orange-100 text-brand-orange",
  slate: "bg-slate-100 text-slate-700",
  emerald: "bg-emerald-100 text-emerald-700"
};

export default function AdminStatCard({ stat }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-500">{stat.label}</div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[stat.tone] || toneClasses.slate}`}>
          {stat.change}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</div>
    </article>
  );
}
