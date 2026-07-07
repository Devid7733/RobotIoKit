"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";

const orderStatuses = ["ALL", "PENDING", "PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"];
const editableOrderStatuses = ["PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"];
const paymentLabels = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  KHQR: "KHQR"
};

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-CA");
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function orderTone(status) {
  if (status === "COMPLETED") {
    return "badge-soft badge-emerald";
  }
  if (status === "SHIPPED") {
    return "badge-soft badge-blue";
  }
  if (status === "CANCELLED") {
    return "badge-soft badge-rose";
  }
  return "badge-soft badge-amber";
}

function paymentTone(status) {
  if (status === "PAID") {
    return "badge-soft badge-emerald";
  }
  if (status === "FAILED" || status === "EXPIRED") {
    return "badge-soft badge-rose";
  }
  return "badge-soft badge-amber";
}

function displayOrderNumber(order) {
  return order.orderNumber || order.id;
}

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);

        const response = await fetch("/api/orders", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to load orders.");
        }

        if (isMounted) {
          setOrders(result.data || []);
        }
      } catch (loadError) {
        if (isMounted) {
          toast.error(loadError instanceof Error ? loadError.message : "Unable to load orders.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updateOrder(orderId, payload) {
    try {
      setSavingId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to update order.");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? result.data : order)));
      toast.success("Order updated.");
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "Unable to update order.");
    } finally {
      setSavingId("");
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "PENDING_KHQR"
          ? order.paymentMethod === "KHQR" && order.payment?.status === "PENDING_VERIFICATION"
          : true;
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        order.id.toLowerCase().includes(search) ||
        (order.orderNumber || "").toLowerCase().includes(search) ||
        (order.customerName || "").toLowerCase().includes(search) ||
        (order.user?.email || "").toLowerCase().includes(search);

      return matchesStatus && matchesPayment && matchesQuery;
    });
  }, [orders, paymentFilter, query, statusFilter]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => ["PENDING", "PREPARING"].includes(order.status)).length,
      pendingKhqr: orders.filter(
        (order) => order.paymentMethod === "KHQR" && order.payment?.status === "PENDING_VERIFICATION"
      ).length,
      paid: orders.filter((order) => order.payment?.status === "PAID").length,
      revenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    }),
    [orders]
  );

  return (
    <section className="admin-page">
      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryCard label="Total Orders" value={summary.total} tone="text-slate-900" />
        <SummaryCard label="Needs Attention" value={summary.pending} tone="text-amber-500" />
        <SummaryCard label="Pending KHQR" value={summary.pendingKhqr} tone="text-brand-orange" />
        <SummaryCard label="Order Revenue" value={formatMoney(summary.revenue)} tone="text-brand-blue" />
      </div>

      <div className="surface-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="heading-card">Orders</h2>
            <p className="mt-2 text-sm text-slate-500">{filteredOrders.length} orders in the current view</p>
          </div>
          {savingId ? <div className="text-sm font-medium text-brand-blue">Saving changes...</div> : null}
        </div>

        <div className="surface-outline mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-base pl-10"
              placeholder="Search order ID or customer"
              type="text"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" className="h-5 w-5" />
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaymentFilter((current) => (current === "PENDING_KHQR" ? "ALL" : "PENDING_KHQR"))}
              className={`badge-soft ${paymentFilter === "PENDING_KHQR" ? "bg-brand-orange text-white" : "badge-orange"}`}
            >
              Pending KHQR
            </button>
            {orderStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`badge-soft ${
                  statusFilter === status ? "bg-brand-blue text-white" : "badge-slate"
                }`}
              >
                {status === "ALL" ? "All" : formatLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse border-t border-slate-100 bg-slate-50 first:border-t-0" />
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order Number</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Method</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    expanded={expandedId === order.id}
                    saving={savingId === order.id}
                    onToggle={() => setExpandedId((current) => (current === order.id ? "" : order.id))}
                    onUpdate={updateOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className="surface-card-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function OrderRow({ order, expanded, saving, onToggle, onUpdate }) {
  const isPendingKhqr = order.paymentMethod === "KHQR" && order.payment?.status === "PENDING_VERIFICATION";
  const paymentStatus = order.payment?.status || "UNPAID";
  const orderNumber = displayOrderNumber(order);

  return (
    <>
      <tr className="border-t border-slate-100 text-sm text-slate-700">
        <td className="px-5 py-4 align-top">
          <div className="font-semibold text-brand-blue">{orderNumber}</div>
          <div className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</div>
        </td>

        <td className="px-5 py-4 align-top">
          <div className="font-medium text-slate-900">{order.customerName || "Guest Customer"}</div>
          <div className="mt-1 text-xs text-slate-500">{order.user?.email || "No email"}</div>
          <div className="mt-2 text-xs text-slate-400">{order.customerPhone || "No phone"}</div>
        </td>

        <td className="px-5 py-4 align-top font-semibold text-slate-900">{formatMoney(order.total)}</td>

        <td className="px-5 py-4 align-top text-sm text-slate-600">
          {paymentLabels[order.paymentMethod] || formatLabel(order.paymentMethod)}
        </td>

        <td className="px-5 py-4 align-top">
          <span className={paymentTone(paymentStatus)}>{formatLabel(paymentStatus)}</span>
        </td>

        <td className="px-5 py-4 align-top">
          {order.status === "PENDING" ? (
            <span className={orderTone(order.status)}>{formatLabel(order.status)}</span>
          ) : (
            <select
              value={order.status}
              disabled={saving}
              onChange={(event) =>
                onUpdate(order.id, {
                  status: event.target.value,
                  paymentStatus
                })
              }
              className={`${orderTone(order.status)} border-0 pr-8`}
            >
              {editableOrderStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          )}
        </td>

        <td className="px-5 py-4 align-top">
          <div className="flex flex-col items-start gap-2">
            <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-2 text-brand-blue">
              <Icon name="eye" className="h-4 w-4" />
              Open
            </Link>
            {isPendingKhqr ? (
              <div className="flex flex-col items-start gap-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    onUpdate(order.id, {
                      paymentStatus: "PAID",
                      status: order.status
                    })
                  }
                  className="text-xs font-semibold text-emerald-600 disabled:opacity-60"
                >
                  Approve Payment
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    onUpdate(order.id, {
                      paymentStatus: "FAILED",
                      status: order.status
                    })
                  }
                  className="text-xs font-semibold text-rose-600 disabled:opacity-60"
                >
                  Reject Payment
                </button>
              </div>
            ) : null}
            {order.payment?.proofImage ? (
              <a
                href={order.payment.proofImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-600"
              >
                View Proof
              </a>
            ) : null}
            <button type="button" onClick={onToggle} className="text-xs font-medium text-slate-500">
              {expanded ? "Hide inline" : "Quick view"}
            </button>
          </div>
        </td>
      </tr>

      {expanded ? (
        <tr className="border-t border-slate-100 bg-slate-50 text-sm">
          <td colSpan={7} className="px-5 py-5">
            <div className="grid gap-6 lg:grid-cols-[1fr,260px]">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {formatDate(order.createdAt)} | Payment {paymentLabels[order.paymentMethod] || formatLabel(order.paymentMethod)}
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-800">
                          {item.product?.name || item.robotKit?.name || "Unknown item"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Qty {item.quantity}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{formatMoney(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Order Summary</div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatMoney(Number(order.total || 0) - Number(order.deliveryFee || 0))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Delivery</span>
                  <span>{formatMoney(order.deliveryFee)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>

                <div className="mt-5 text-sm leading-6 text-slate-500">
                  <div>{order.customerPhone || "No phone"}</div>
                  <div className="mt-2">
                    {[order.address, order.city, order.province].filter(Boolean).join(", ") || "No address provided"}
                  </div>
                  {order.note ? <div className="mt-2">Note: {order.note}</div> : null}
                  {order.payment?.proofImage ? (
                    <a
                      href={order.payment.proofImage}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex font-semibold text-brand-blue"
                    >
                      Open payment proof
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
