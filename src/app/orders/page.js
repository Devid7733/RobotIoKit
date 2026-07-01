import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/common/Breadcrumb";
import Icon from "@/components/common/Icon";
import CancelOrderButton from "@/components/storefront/CancelOrderButton";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { auth } from "@/lib/auth";
import { getUserOrdersPaginated } from "@/modules/order/order.service";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "Not available";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function shortId(id) {
  const value = String(id || "");
  return `#${value.slice(-6).toUpperCase()}`;
}

function displayOrderNumber(order) {
  return order.orderNumber || shortId(order.id);
}

function isRecentlyUpdated(timestamp) {
  if (!timestamp) return false;

  const updatedAt = new Date(timestamp).getTime();

  if (Number.isNaN(updatedAt)) {
    return false;
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return now - updatedAt <= dayMs;
}

export const metadata = {
  title: "Order History | RobotIoKit",
  description: "View your RobotIoKit order history and payment status."
};

function orderTone(status) {
  if (status === "COMPLETED") return "badge-soft badge-emerald";
  if (status === "SHIPPED") return "badge-soft badge-blue";
  if (status === "CANCELLED") return "badge-soft badge-rose";
  return "badge-soft badge-amber";
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPaymentStatus(status) {
  if (status === "PAID") return "Paid";
  if (status === "PENDING_VERIFICATION") return "Waiting for admin verification";
  if (status === "EXPIRED") return "Payment Expired";
  if (status === "FAILED") return "Failed";
  if (status === "UNPAID") return "Unpaid";
  return "Pending";
}

function paymentAction(order) {
  const payment = order.payment || {};
  const status = payment.status || "UNPAID";

  if (order.status === "CANCELLED") {
    return {
      href: "/products",
      label: "Order Again",
      className: "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
    };
  }

  if (order.status !== "PENDING") {
    return null;
  }

  if (order.paymentMethod === "KHQR" && status === "UNPAID") {
    return {
      href: `/checkout/khqr?orderId=${order.id}`,
      label: "Pay Now",
      className: "bg-brand-blue text-white hover:bg-[#163fe0]"
    };
  }

  if (order.paymentMethod === "KHQR" && status === "EXPIRED") {
    return {
      href: "/products",
      label: "Order Again",
      note: "Payment Expired",
      className: "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
    };
  }

  if (status === "PENDING_VERIFICATION") {
    return {
      label: "Waiting for admin verification",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    };
  }

  if (status === "PAID") {
    return {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    };
  }

  return null;
}

function latestOrderText(order) {
  const latestEntry = order.timeline?.[0];
  const paymentStatus = order.payment?.status;

  if (!latestEntry) {
    return "Order updates will appear here as your order progresses.";
  }

  if (latestEntry.type === "KHQR_PAYMENT_EXPIRED" && paymentStatus !== "EXPIRED") {
    if (paymentStatus === "PAID") {
      return "Payment verified. Your order is being prepared.";
    }

    if (paymentStatus === "PENDING_VERIFICATION") {
      return "Payment proof uploaded and awaiting verification.";
    }
  }

  if (latestEntry.type === "ORDER_CREATED") {
    return "Placed and awaiting store review.";
  }

  return latestEntry.message || `${formatLabel(latestEntry.type)}.`;
}

function itemSummary(order) {
  const count = order.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export default async function OrdersPage({ searchParams }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { orders, total, totalPages } = await getUserOrdersPaginated(session.user.id, page);

  return (
    <StorefrontShell>
      <div className="storefront-container page-section">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "My Account", href: "/account" },
            { label: "Orders" }
          ]}
        />

        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="page-kicker">Order History</p>
              <h1 className="page-title">My Orders</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {total} {total === 1 ? "order" : "orders"} found
              </p>
            </div>
            {orders.length > 0 ? (
              <Link href="/products" className="button-secondary w-fit">
                Continue shopping
              </Link>
            ) : null}
          </div>

          <div className="mt-7">
            {orders.length === 0 ? (
              <div className="surface-card border-dashed border-slate-300 px-6 py-14 text-center">
                <h2 className="font-display text-2xl font-semibold text-slate-900">No orders yet</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  When you place an order, it will appear here with payment and delivery status.
                </p>
                <Link href="/products" className="button-blue mt-6">
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
              <div className="space-y-3">
                {orders.map((order) => {
                  const paymentStatus = order.payment?.status || "UNPAID";
                  const action = paymentAction(order);
                  const orderNumber = displayOrderNumber(order);
                  const canCancel = order.status === "PENDING";

                  return (
                    <article
                      key={order.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.045)] transition-colors hover:border-slate-300 sm:p-5"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.25fr,0.8fr,0.9fr,auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              title={order.orderNumber || order.id}
                              className="font-display text-xl font-semibold tracking-tight text-slate-950 hover:text-brand-blue"
                            >
                              {orderNumber}
                            </Link>
                            {isRecentlyUpdated(order.timeline?.[0]?.createdAt) ? (
                              <span className="badge-pill badge-blue">Updated</span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                            <span>{formatDate(order.createdAt)}</span>
                            <span aria-hidden="true">|</span>
                            <span>{itemSummary(order)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Status
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={orderTone(order.status)}>{formatLabel(order.status)}</span>
                            <span className="text-sm font-medium text-slate-500">
                              Payment: {formatPaymentStatus(paymentStatus)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Total
                          </div>
                          <div className="mt-1 text-2xl font-bold tracking-tight text-brand-blue">
                            {formatMoney(order.total)}
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{latestOrderText(order)}</p>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-40">
                          <Link
                            href={action?.href || `/orders/${order.id}`}
                            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-center text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${
                              action?.className || "bg-slate-900 text-white hover:bg-brand-blue"
                            }`}
                          >
                            {action?.href ? null : <Icon name="eye" className="h-4 w-4" />}
                            {action?.label || "View Details"}
                          </Link>
                          {action?.note ? (
                            <div className="text-center text-xs font-semibold text-rose-600">{action.note}</div>
                          ) : null}
                          {canCancel ? <CancelOrderButton orderId={order.id} compact /> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {totalPages > 1 ? (
                <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Order pagination">
                  {page > 1 ? (
                    <Link href={`/orders?page=${page - 1}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue">‹</Link>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-sm text-slate-300">‹</span>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/orders?page=${p}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition ${p === page ? "border-brand-blue bg-brand-blue text-white" : "border-slate-200 bg-white text-slate-700 hover:border-brand-blue hover:text-brand-blue"}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages ? (
                    <Link href={`/orders?page=${page + 1}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue">›</Link>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-sm text-slate-300">›</span>
                  )}
                </nav>
              ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
