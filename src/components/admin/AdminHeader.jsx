import AdminHeaderBadges from "@/components/admin/AdminHeaderBadges";

export default function AdminHeader({
  title = "Dashboard"
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className="flex items-center gap-5">
        <AdminHeaderBadges />
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-base font-semibold text-white">
            A
          </div>
          <div className="hidden sm:block">
            <div className="text-base font-semibold text-slate-900">Admin</div>
            <div className="text-sm text-slate-500">admin@robotiokit.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
