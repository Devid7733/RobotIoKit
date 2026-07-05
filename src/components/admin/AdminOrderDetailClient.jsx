"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CAMBODIA_PROVINCES } from "@/lib/provinces";

const editableOrderStatuses = ["PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"];

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-CA");
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function quickActionPayload(action, order) {
  if (action === "approvePayment") {
    return {
      ...basePayload(order),
      paymentStatus: "PAID",
      status: order.status
    };
  }
  if (action === "rejectPayment") {
    return {
      ...basePayload(order),
      paymentStatus: "FAILED",
      status: order.status
    };
  }
  if (action === "shipped") {
    return { ...basePayload(order), status: "SHIPPED" };
  }
  if (action === "completed") {
    return { ...basePayload(order), status: "COMPLETED", paymentStatus: order.payment?.status || "UNPAID" };
  }
  if (action === "cancelled") {
    return { ...basePayload(order), status: "CANCELLED" };
  }
  return basePayload(order);
}

function basePayload(order) {
  return {
    status: order.status,
    paymentStatus: order.payment?.status || "UNPAID",
    paymentMethod: order.payment?.method || order.paymentMethod,
    paymentReference: order.payment?.reference || "",
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    province: order.province || "",
    address: order.address || "",
    note: order.note || ""
  };
}

export default function AdminOrderDetailClient({ orderId }) {
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to load order.");
        }

        if (isMounted) {
          setOrder(result.data);
          setForm(basePayload(result.data));
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : "Unable to load order.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  async function save(payload) {
    try {
      setSaving(true);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to update order.");
      }

      setOrder(result.data);
      setForm(basePayload(result.data));
      toast.success("Order updated.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.06)]" />;
  }

  if (loadError && !order) {
    return (
      <div className="surface-card">
        <div className="text-lg font-semibold text-red-500">Failed to load order</div>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
      </div>
    );
  }

  const canReviewPayment = order.payment?.status === "PENDING_VERIFICATION";
  const orderNumber = order.orderNumber || order.id;

  return (
    <section className="admin-page">
      <div className="surface-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="admin-kicker">Order Workspace</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">{orderNumber}</h2>
            <div className="mt-3 text-sm text-slate-500">
              Created {formatDate(order.createdAt)} by {order.customerName || "Guest Customer"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canReviewPayment ? (
              <>
                <button
                  type="button"
                  onClick={() => save(quickActionPayload("approvePayment", order))}
                  disabled={saving}
                  className="button-success px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve Payment
                </button>
                <button
                  type="button"
                  onClick={() => save(quickActionPayload("rejectPayment", order))}
                  disabled={saving}
                  className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject Payment
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => save(quickActionPayload("shipped", order))}
              disabled={saving}
              className="rounded-2xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark Shipped
            </button>
            <button
              type="button"
              onClick={() => save(quickActionPayload("completed", order))}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark Completed
            </button>
            <button
              type="button"
              onClick={() => save(quickActionPayload("cancelled", order))}
              disabled={saving}
              className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="surface-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-slate-900">Customer & Fulfillment</h3>
              {saving ? <span className="text-sm text-brand-blue">Saving...</span> : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                save(form);
              }}
              className="mt-6 grid gap-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Customer Name
                  <input
                    value={form.customerName}
                    onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                    className="input-base"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone Number
                  <input
                    value={form.customerPhone}
                    onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                    className="input-base"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Order Status
                  {form.status === "PENDING" ? (
                    <div className="input-base bg-slate-50 text-slate-500">{formatLabel(form.status)}</div>
                  ) : (
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                      className="input-base"
                    >
                      {editableOrderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Payment Status
                  <div className="input-base bg-slate-50 text-slate-500">{formatLabel(form.paymentStatus)}</div>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Payment Method
                  <select
                    value={form.paymentMethod}
                    onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                    className="input-base"
                  >
                    <option value="KHQR">KHQR</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Payment Reference
                <input
                  value={form.paymentReference}
                  onChange={(event) => setForm((current) => ({ ...current, paymentReference: event.target.value }))}
                  className="input-base"
                  placeholder="KHQR ref, transfer code, or internal payment note"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Province
                <select
                  value={form.province}
                  onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))}
                  className="input-base"
                >
                  <option value="">Select province</option>
                  {CAMBODIA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Address
                <textarea
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  className="input-base min-h-24"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Admin Note
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  className="input-base min-h-28"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <Link href="/admin/orders" className="button-secondary px-5 py-2.5">
                  Back to Orders
                </Link>
                <button type="submit" disabled={saving} className="button-blue px-5 py-2.5 disabled:opacity-60">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="surface-card">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Order Items</h3>
            <div className="mt-6 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="surface-outline flex items-center justify-between bg-white">
                  <div>
                    <div className="font-medium text-slate-900">{item.product?.name || item.robotKit?.name || "Unknown item"}</div>
                    <div className="mt-1 text-sm text-slate-500">Qty {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{formatMoney(item.price * item.quantity)}</div>
                    <div className="mt-1 text-sm text-slate-500">{formatMoney(item.price)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Summary</h3>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span>{formatMoney(order.deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Payment</h3>
            <div className="mt-6 space-y-3 text-sm text-slate-500">
              <div className="flex items-center justify-between">
                <span>Method</span>
                <span className="font-medium text-slate-900">{formatLabel(order.payment?.method || order.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium text-slate-900">{formatLabel(order.payment?.status || "UNPAID")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reference</span>
                <span className="font-medium text-slate-900">{order.payment?.reference || "N/A"}</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Payment Proof</div>
                {order.payment?.proofImage ? (
                  <a
                    href={order.payment.proofImage}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <img
                      src={order.payment.proofImage}
                      alt={`Payment proof for order ${orderNumber}`}
                      className="max-h-80 w-full object-contain"
                    />
                  </a>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">No screenshot uploaded yet.</div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Customer Account</div>
                <div className="mt-2 text-sm text-slate-700">{order.user?.email || "Guest checkout"}</div>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <h3 className="font-display text-2xl font-semibold text-slate-900">Fulfillment Timeline</h3>
            <div className="mt-6 space-y-4">
              {order.timeline?.length ? (
                order.timeline.map((entry) => (
                  <div key={entry.id} className="surface-outline bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{formatLabel(entry.type)}</div>
                      <div className="text-xs text-slate-400">{formatDate(entry.createdAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{entry.message}</div>
                    <div className="mt-2 text-xs text-slate-400">{entry.actorName || "System"}</div>
                  </div>
                ))
              ) : (
                <div className="surface-card-muted text-sm text-slate-500">
                  No timeline history yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
