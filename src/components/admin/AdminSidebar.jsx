"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/common/Icon";

const links = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Products", href: "/admin/products", icon: "cube" },
  { label: "Robot Kits", href: "/admin/robot-kits", icon: "chip" },
  { label: "Orders", href: "/admin/orders", icon: "package" },
  { label: "Customers", href: "/admin/customers", icon: "users" },
  { label: "Analytics", href: "/admin/analytics", icon: "trendUp" },
  { label: "Settings", href: "/admin/settings", icon: "settings" }
];

function isActivePath(pathname, href) {
  const path = pathname || "/";

  if (href === "/admin") {
    return path === "/admin";
  }

  return path === href || path.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-white/5 bg-[#131c2d]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link href="/" className="font-display text-[2rem] font-bold tracking-tight text-white">
          Robot<span className="text-brand-orange">Io</span>Kit
        </Link>
        <Link href="/" className="text-lg text-slate-400 transition hover:text-white">
          ×
        </Link>
      </div>

      <div className="border-b border-white/10 px-6 py-5 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Admin Panel
      </div>

      <nav className="py-4">
        {links.map((link) => {
          const isActive = isActivePath(pathname, link.href);

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-4 text-[1.05rem] font-medium transition ${
                isActive
                  ? "bg-brand-blue text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={link.icon} className="h-5 w-5" />
              <span>{link.label}</span>
              {isActive ? <span className="ml-auto text-white">›</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-6 py-5">
        <Link href="/" className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-white">
          <span className="text-lg">‹</span>
          <span>Back to Store</span>
        </Link>
      </div>
    </div>
  );
}
