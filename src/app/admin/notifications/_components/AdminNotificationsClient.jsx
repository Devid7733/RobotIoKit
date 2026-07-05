"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";

async function readJson(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload.data;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminNotificationsClient() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", { cache: "no-store" });
    const data = await readJson(response);
    setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
  }, []);

  useEffect(() => {
    loadNotifications()
      .catch((loadError) => toast.error(loadError.message || "Unable to load notifications."))
      .finally(() => setLoading(false));
  }, [loadNotifications]);

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
    } catch (markError) {
      toast.error(markError.message || "Unable to mark notification read.");
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
      toast.success("All notifications marked read.");
    } catch (markError) {
      toast.error(markError.message || "Unable to mark notifications read.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Admin alerts</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Notification list</h2>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={markAllRead}
            disabled={savingId === "all"}
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`grid gap-4 px-5 py-4 sm:grid-cols-[1fr,auto] ${
                  notification.read ? "bg-white" : "bg-blue-50/50"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{notification.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        notification.read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {notification.read ? "Read" : "Unread"}
                    </span>
                    {notification.typeLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {notification.typeLabel}
                      </span>
                    ) : null}
                    {notification.status ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {notification.status}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{notification.message || notification.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(notification.createdAt)}</span>
                    {notification.orderId ? (
                      <Link
                        href={`/admin/orders/${notification.orderId}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:text-blue-700"
                      >
                        View order
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>

                {!notification.read ? (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => markRead(notification.id)}
                    disabled={savingId === notification.id}
                  >
                    Mark read
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
