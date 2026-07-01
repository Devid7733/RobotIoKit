export default function AdminQuickActions({ items }) {
  return (
    <section className="surface-card-dark">
      <h2 className="font-display text-2xl font-semibold">Quick actions</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
            <div className="font-semibold">{item.title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-100">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
