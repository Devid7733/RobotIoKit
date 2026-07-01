export default function AdminShell({ sidebar, header, children }) {
  return (
    <div className="min-h-screen bg-[#f3f5f9]">
      <div className="grid min-h-screen lg:grid-cols-[280px,1fr]">
        <aside className="bg-brand-dark text-white">{sidebar}</aside>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">{header}</header>
          <main className="flex-1 px-6 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
