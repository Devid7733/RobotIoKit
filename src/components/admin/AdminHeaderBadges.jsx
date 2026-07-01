"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";

function formatBadgeCount(count) {
  return count > 99 ? "99+" : String(count);
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload.data;
}

export default function AdminHeaderBadges() {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotificationCount = useCallback(async () => {
    const response = await fetch("/api/admin/notifications/unread-count", { cache: "no-store" });
    const data = await readJson(response);
    setUnreadCount(Number(data?.unreadCount || 0));
  }, []);

  useEffect(() => {
    loadNotificationCount().catch(() => setUnreadCount(0));

    const refreshNotifications = () => {
      loadNotificationCount().catch(() => setUnreadCount(0));
    };

    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        refreshNotifications();
      }
    };

    window.addEventListener("focus", refreshNotifications);
    window.addEventListener("admin:notifications-read", refreshNotifications);
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      window.removeEventListener("focus", refreshNotifications);
      window.removeEventListener("admin:notifications-read", refreshNotifications);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [loadNotificationCount]);

  return (
    <>
      <Link
        href="/admin/notifications"
        className="relative text-slate-500 transition hover:text-slate-800"
        aria-label="Notifications"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-semibold leading-5 text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
      </Link>
    </>
  );
}
