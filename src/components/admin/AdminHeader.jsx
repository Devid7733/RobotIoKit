"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import AdminHeaderBadges from "@/components/admin/AdminHeaderBadges";
import Avatar from "@/components/common/Avatar";

export default function AdminHeader({
  title = "Dashboard",
  primaryLabel,
  primaryHref
}) {
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email || "Admin";

  return (
    <div className="flex items-center justify-between px-6 py-3 sm:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className="flex items-center gap-5">
        {primaryLabel && primaryHref ? (
          <Link href={primaryHref} className="button-secondary px-4 py-2.5 text-sm">
            {primaryLabel}
          </Link>
        ) : null}
        <AdminHeaderBadges />
        <div className="flex items-center gap-3">
          <Avatar user={session?.user || {}} className="h-11 w-11" />
          <div className="hidden sm:block">
            <div className="text-base font-semibold text-slate-900">{displayName}</div>
            <div className="text-sm text-slate-500">{session?.user?.email || ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
