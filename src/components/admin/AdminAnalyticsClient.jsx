"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

const periods = [
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" }
];

const donutColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981"];

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function toneForStatus(value) {
  if (value === "PAID" || value === "COMPLETED") {
    return "badge-soft badge-emerald";
  }
  if (value === "FAILED" || value === "CANCELLED") {
    return "badge-soft badge-rose";
  }
  if (value === "SHIPPED") {
    return "badge-soft badge-blue";
  }
  return "badge-soft badge-amber";
}

function toneForMethod(value) {
  if (value === "KHQR") {
    return "badge-soft badge-blue";
  }
  return "badge-soft badge-orange";
}

function percentage(part, total) {
  if (!total) {
    return 0;
  }

  return (Number(part || 0) / Number(total)) * 100;
}

function escapeCsv(value) {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ChartCanvas({ type, data, options, className = "h-72" }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function AdminAnalyticsClient() {
  const [period, setPeriod] = useState("6m");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        setError("");
        setIsRefreshing(true);
        const response = await fetch(`/api/analytics?period=${period}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to load analytics.");
        }

        if (active) {
          setData(result.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
        }
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [period]);

  const maxProductQty = useMemo(() => Math.max(...(data?.bestSellingProducts?.map((item) => item.quantity) || [1])), [data]);
  const totalRobotKitSales = useMemo(
    () => (data?.bestSellingRobotKits || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [data]
  );

  const orderLineData = useMemo(
    () => ({
      labels: data?.monthlyTrend?.map((item) => item.label) || [],
      datasets: [
        {
          label: "Orders",
          data: data?.monthlyTrend?.map((item) => item.orders) || [],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 6,
          borderWidth: 3,
          fill: false,
          tension: 0.35
        }
      ]
    }),
    [data]
  );

  const revenueBarData = useMemo(
    () => ({
      labels: data?.monthlyTrend?.map((item) => item.label) || [],
      datasets: [
        {
          label: "Revenue",
          data: data?.monthlyTrend?.map((item) => Number(item.revenue || 0)) || [],
          borderRadius: 12,
          maxBarThickness: 56,
          backgroundColor: "#6366f1",
          hoverBackgroundColor: "#4f46e5"
        }
      ]
    }),
    [data]
  );

  const robotKitDoughnutData = useMemo(
    () => ({
      labels: data?.bestSellingRobotKits?.map((item) => item.name) || [],
      datasets: [
        {
          data: data?.bestSellingRobotKits?.map((item) => item.quantity) || [],
          backgroundColor: donutColors,
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 6,
          cutout: "68%"
        }
      ]
    }),
    [data]
  );

  const commonGrid = {
    color: "rgba(148,163,184,0.18)",
    drawBorder: false,
    tickLength: 0
  };

  const commonTick = {
    color: "#94a3b8",
    font: {
      size: 12,
      weight: "500"
    },
    padding: 10
  };

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
          padding: 12,
          displayColors: false
        }
      },
      layout: {
        padding: {
          left: 8,
          right: 8,
          top: 8,
          bottom: 0
        }
      },
      scales: {
        x: {
          grid: {
            ...commonGrid,
            borderDash: [4, 4]
          },
          ticks: commonTick
        },
        y: {
          beginAtZero: true,
          grid: {
            ...commonGrid,
            borderDash: [4, 4]
          },
          ticks: {
            ...commonTick,
            precision: 0
          }
        }
      }
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
          padding: 12,
          displayColors: false,
          callbacks: {
            label(context) {
              return formatMoney(context.raw);
            }
          }
        }
      },
      layout: {
        padding: {
          left: 8,
          right: 8,
          top: 8,
          bottom: 0
        }
      },
      scales: {
        x: {
          grid: {
            ...commonGrid,
            display: true,
            borderDash: [4, 4]
          },
          ticks: commonTick
        },
        y: {
          beginAtZero: true,
          grid: {
            ...commonGrid,
            borderDash: [4, 4]
          },
          ticks: {
            ...commonTick,
            callback(value) {
              return `$${value}`;
            }
          }
        }
      }
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
          padding: 12,
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
              const share = percentage(context.raw, total);
              return `${context.label}: ${context.raw} (${formatPercent(share)})`;
            }
          }
        }
      }
    }),
    []
  );

  const exportRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const rows = [["Section", "Label", "Value", "Extra"]];

    rows.push(["Summary", "Total Orders", data.summary.totalOrders, ""]);
    rows.push(["Summary", "Total Revenue", data.summary.totalRevenue, ""]);
    rows.push(["Summary", "Average Order Value", data.summary.avgOrderValue, ""]);
    rows.push(["Summary", "Peak Month", data.summary.peakMonth, ""]);

    data.monthlyTrend.forEach((item) => {
      rows.push(["Monthly Trend", item.label, item.orders, item.revenue]);
    });

    data.orderStatusBreakdown.forEach((item) => {
      rows.push(["Order Status", item.label, item.count, formatPercent(percentage(item.count, data.summary.totalOrders))]);
    });

    data.paymentStatusBreakdown.forEach((item) => {
      rows.push(["Payment Status", item.label, item.count, formatPercent(percentage(item.count, data.summary.totalOrders))]);
    });

    data.paymentMethodBreakdown.forEach((item) => {
      rows.push(["Payment Method", item.label, item.count, formatPercent(percentage(item.count, data.summary.totalOrders))]);
    });

    data.bestSellingProducts.forEach((item) => {
      rows.push(["Best Selling Product", item.name, item.quantity, ""]);
    });

    data.bestSellingRobotKits.forEach((item) => {
      rows.push(["Best Selling Robot Kit", item.name, item.quantity, ""]);
    });

    return rows;
  }, [data]);

  if (error) {
    return (
      <div className="surface-card">
        <div className="text-lg font-semibold text-red-500">Failed to load analytics</div>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.06)]"
            />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.06)]" />
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.06)]" />
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Orders", value: data.summary.totalOrders },
    { label: "Total Revenue", value: formatMoney(data.summary.totalRevenue) },
    { label: "Avg. Order Value", value: formatMoney(data.summary.avgOrderValue) },
    { label: "Peak Month", value: data.summary.peakMonth }
  ];

  return (
    <section className="admin-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Analytics</h2>
          <p className="mt-2 text-sm text-slate-500">Store performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(`robotiokit-analytics-${period}.csv`, exportRows)}
            className="button-secondary px-4 py-2.5"
          >
            Export CSV
          </button>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
            {periods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  period === item.value ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`surface-card-sm transition duration-300 ${isRefreshing ? "scale-[0.985] opacity-70" : "opacity-100"}`}
          >
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-3 font-display text-3xl font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 transition duration-300 xl:grid-cols-2 ${isRefreshing ? "opacity-75" : "opacity-100"}`}>
        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Orders Trend</h3>
            <div className="flex items-center gap-3">
              {isRefreshing ? (
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand-blue" />
                  Updating
                </div>
              ) : null}
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Volume by period</div>
            </div>
          </div>
          <div className="mt-8">
            <ChartCanvas type="line" data={orderLineData} options={lineOptions} className="h-80" />
          </div>
        </div>

        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Revenue Trend</h3>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Revenue by period</div>
          </div>
          <div className="mt-8">
            <ChartCanvas type="bar" data={revenueBarData} options={barOptions} className="h-80" />
          </div>
        </div>
      </div>

      <div className={`grid gap-6 transition duration-300 xl:grid-cols-2 ${isRefreshing ? "opacity-80" : "opacity-100"}`}>
        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <h3 className="font-display text-2xl font-semibold text-slate-900">Best Selling Products</h3>
          <div className="mt-8 space-y-5">
            {data.bestSellingProducts.length ? (
              data.bestSellingProducts.map((item, index) => (
                <div key={item.id || `${item.name}-${index}`} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-semibold text-brand-blue">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-900">{item.name}</span>
                      <span className="shrink-0 text-slate-500">{item.quantity} sold</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-brand-blue"
                        style={{ width: `${Math.max((item.quantity / maxProductQty) * 100, item.quantity ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="surface-card-muted text-sm text-slate-500">No product sales yet.</div>
            )}
          </div>
        </div>

        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <h3 className="font-display text-2xl font-semibold text-slate-900">Popular Robot Kits</h3>
          {data.bestSellingRobotKits.length ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[260px,1fr] lg:items-center">
              <div className="relative mx-auto h-56 w-56">
                <ChartCanvas type="doughnut" data={robotKitDoughnutData} options={doughnutOptions} className="h-56 w-56" />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total Kit Sales</div>
                  <div className="mt-2 font-display text-4xl font-semibold text-slate-900">{totalRobotKitSales}</div>
                </div>
              </div>
              <div className="space-y-3">
                {data.bestSellingRobotKits.map((item, index) => {
                  const share = percentage(item.quantity, totalRobotKitSales);
                  return (
                    <div key={item.id || `${item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: donutColors[index % donutColors.length] }} />
                          <span className="truncate font-medium text-slate-900">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">{item.quantity}</div>
                          <div className="text-xs text-slate-500">{formatPercent(share)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="surface-card-muted mt-8 text-sm text-slate-500">No robot kit sales yet.</div>
          )}
        </div>
      </div>

      <div className={`grid gap-6 transition duration-300 xl:grid-cols-3 ${isRefreshing ? "opacity-80" : "opacity-100"}`}>
        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <h3 className="font-display text-2xl font-semibold text-slate-900">Order Status</h3>
          <div className="mt-6 space-y-3">
            {data.orderStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={toneForStatus(item.status)}>{item.label}</span>
                  <span className="text-xs text-slate-400">{formatPercent(percentage(item.count, data.summary.totalOrders))}</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <h3 className="font-display text-2xl font-semibold text-slate-900">Payment Status</h3>
          <div className="mt-6 space-y-3">
            {data.paymentStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={toneForStatus(item.status)}>{item.label}</span>
                  <span className="text-xs text-slate-400">{formatPercent(percentage(item.count, data.summary.totalOrders))}</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`surface-card transition duration-300 ${isRefreshing ? "translate-y-1" : "translate-y-0"}`}>
          <h3 className="font-display text-2xl font-semibold text-slate-900">Payment Method</h3>
          <div className="mt-6 space-y-3">
            {data.paymentMethodBreakdown.map((item) => (
              <div key={item.method} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={toneForMethod(item.method)}>{item.label}</span>
                  <span className="text-xs text-slate-400">{formatPercent(percentage(item.count, data.summary.totalOrders))}</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
