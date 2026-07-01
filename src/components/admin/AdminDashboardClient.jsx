"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/common/Icon";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function displayOrderNumber(order) {
  return order.orderNumber || order.id;
}

function statusPillClass(status) {
  const value = String(status || "").toUpperCase();

  if (value === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (value === "PAID" || value === "SHIPPED") {
    return "bg-blue-100 text-brand-blue";
  }

  if (value === "PENDING" || value === "PREPARING") {
    return "bg-amber-100 text-amber-700";
  }

  if (value === "CANCELLED" || value === "FAILED" || value === "EXPIRED") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const topMetricConfig = [
  { title: "Today Sales", icon: "creditCard", iconWrap: "bg-brand-blue text-white", delta: "+12%", valueKey: "todaySales" },
  { title: "Orders Today", icon: "package", iconWrap: "bg-indigo-500 text-white", delta: "+3", valueKey: "ordersToday", plainNumber: true },
  { title: "This Week Revenue", icon: "trendUp", iconWrap: "bg-violet-500 text-white", delta: "+8%", valueKey: "weekRevenue" },
  { title: "This Month Revenue", icon: "calendar", iconWrap: "bg-cyan-500 text-white", delta: "+15%", valueKey: "monthRevenue" }
];

const secondaryMetricConfig = [
  { title: "Pending Orders", subtitle: "Awaiting fulfillment", icon: "clock", iconWrap: "bg-amber-100 text-amber-500", valueKey: "pendingOrders" },
  { title: "Total Products", subtitle: "Active SKUs", icon: "cube", iconWrap: "bg-blue-100 text-brand-blue", valueKey: "totalProducts" },
  { title: "Low Stock Alerts", subtitle: "Under 20 units", icon: "alertTriangle", iconWrap: "bg-orange-100 text-orange-500", valueKey: "lowStockAlerts" },
  { title: "Out of Stock", subtitle: "Need restocking", icon: "xCircle", iconWrap: "bg-rose-100 text-rose-500", valueKey: "outOfStock" }
];

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div>
        <div className="h-9 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-3 h-5 w-96 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.95fr,0.95fr]">
        <div className="h-80 animate-pulse rounded-[22px] border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-[22px] border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function TopMetricCard({ metric }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className={`inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl ${metric.iconWrap}`}>
          <Icon name={metric.icon} className="h-6 w-6" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          ↗ {metric.delta}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-sm font-medium text-slate-500">{metric.title}</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{metric.value}</div>
      </div>
    </article>
  );
}

function SecondaryMetricCard({ metric }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl ${metric.iconWrap}`}>
          <Icon name={metric.icon} className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{metric.title}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{metric.value}</div>
          <div className="mt-1 text-xs text-slate-400">{metric.subtitle}</div>
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboardClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        const response = await fetch("/api/admin/overview", {
          cache: "no-store"
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to load admin overview.");
        }

        if (isMounted) {
          setData(result.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load admin overview.");
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-[22px] border border-rose-200 bg-white p-6">
        <div className="text-lg font-semibold text-rose-600">Failed to load dashboard</div>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const totalRevenue = Number(data.stats.find((item) => item.label === "Total Revenue")?.value || 0);
  const ordersCount = Number(data.stats.find((item) => item.label === "Orders")?.value || 0);
  const totalProducts = Number(data.stats.find((item) => item.label === "Products")?.value || 0);
  const lowStockAlerts = data.inventoryAlerts.length;
  const outOfStock = data.inventoryAlerts.filter((item) => item.stock <= 0).length;
  const pendingOrders = data.recentOrders.filter((order) => ["PENDING", "PREPARING"].includes(order.status)).length;

  const topMetrics = topMetricConfig.map((metric) => {
    let value = totalRevenue;

    if (metric.valueKey === "ordersToday") {
      value = Math.max(ordersCount, data.recentOrders.length);
    } else if (metric.valueKey === "weekRevenue") {
      value = totalRevenue;
    } else if (metric.valueKey === "monthRevenue") {
      value = totalRevenue;
    }

    return {
      ...metric,
      value: metric.plainNumber ? String(value) : formatMoney(value)
    };
  });

  const secondaryMetrics = secondaryMetricConfig.map((metric) => {
    let value = 0;

    if (metric.valueKey === "pendingOrders") {
      value = pendingOrders;
    } else if (metric.valueKey === "totalProducts") {
      value = totalProducts;
    } else if (metric.valueKey === "lowStockAlerts") {
      value = lowStockAlerts;
    } else if (metric.valueKey === "outOfStock") {
      value = outOfStock;
    }

    return {
      ...metric,
      value: String(value)
    };
  });

  return (
    <div className="space-y-7">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard Overview</h2>
        <p className="mt-2 text-sm text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topMetrics.map((metric) => (
          <TopMetricCard key={metric.title} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryMetrics.map((metric) => (
          <SecondaryMetricCard key={metric.title} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.95fr,0.95fr]">
        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
            <a href="/admin/orders" className="text-base font-medium text-brand-blue">
              View all
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-sm uppercase tracking-[0.04em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Order Number</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => {
                  const paymentStatus = order.payment?.status || "UNPAID";
                  const paymentLabel = formatLabel(paymentStatus);
                  const statusLabel =
                    order.status === "PREPARING"
                      ? "Processing"
                      : order.status.charAt(0) + order.status.slice(1).toLowerCase();

                  return (
                    <tr key={order.id} className="border-t border-slate-100 text-sm text-slate-800">
                      <td className="px-6 py-5 font-medium text-brand-blue">{displayOrderNumber(order)}</td>
                      <td className="px-6 py-5">{order.customerName || "Guest Customer"}</td>
                      <td className="px-6 py-5 font-medium text-slate-900">{formatMoney(order.total)}</td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusPillClass(paymentStatus)}`}>
                          {paymentLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusPillClass(order.status)}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-base font-semibold text-slate-900">Low Stock Alert</h3>
          </div>
          <div className="p-6">
            {data.inventoryAlerts.length ? (
              <div className="space-y-4">
                {data.inventoryAlerts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.stock} units remaining</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[17rem] items-center justify-center text-base text-slate-400">
                No low stock alerts
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
