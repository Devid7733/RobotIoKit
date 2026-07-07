"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";

function formatBadgeCount(count) {
  return count > 99 ? "99+" : String(count);
}

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [savingId, setSavingId] = useState("");
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const loadNotificationCount = useCallback(async () => {
    const response = await fetch("/api/admin/notifications/unread-count", { cache: "no-store" });
    const data = await readJson(response);
    setUnreadCount(Number(data?.unreadCount || 0));
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      const data = await readJson(response);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingList(false);
    }
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

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (panelRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function markRead(notificationId) {
    setSavingId(notificationId);

    try {
      const response = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ notificationId })
      });
      await readJson(response);
      await loadNotifications();
      window.dispatchEvent(new Event("admin:notifications-read"));
    } catch {
      // silent
    } finally {
      setSavingId("");
    }
  }

  async function markAllRead() {
    setSavingId("all");

    try {
      const response = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ all: true })
      });
      await readJson(response);
      await loadNotifications();
      window.dispatchEvent(new Event("admin:notifications-read"));
    } catch {
      // silent
    } finally {
      setSavingId("");
    }
  }

  const preview = notifications.slice(0, 6);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative text-slate-500 transition hover:text-slate-800"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-semibold leading-5 text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                disabled={savingId === "all"}
                className="text-xs font-semibold text-brand-blue transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadingList ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Loading…</div>
            ) : preview.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {preview.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 ${notification.read ? "bg-white" : "bg-blue-50/50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{notification.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {notification.message || notification.body}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-400">
                          {formatNotificationDate(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => markRead(notification.id)}
                          disabled={savingId === notification.id}
                          className="shrink-0 text-xs font-semibold text-brand-blue transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-brand-blue transition hover:bg-slate-50"
          >
            View all
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
