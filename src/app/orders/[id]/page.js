import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/common/Breadcrumb";
import CancelOrderButton from "@/components/storefront/CancelOrderButton";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { auth } from "@/lib/auth";
import { getUserOrderById } from "@/modules/order/order.service";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }) {
  return {
    title: "Order Detail | RobotIoKit"
  };
}

export default async function OrderDetailPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const order = await getUserOrderById(session.user.id, params.id);

  if (!order) {
    notFound();
  }

  const orderNumber = order.orderNumber || order.id;
  const canCancel = order.status === "PENDING";

  return (
    <StorefrontShell>
      <div className="storefront-container page-section">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "My Account", href: "/account" },
            { label: "Orders", href: "/orders" },
            { label: orderNumber }
          ]}
        />

        <section className="page-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="page-kicker">Order Detail</p>
              <h1 className="page-title">{orderNumber}</h1>
              <p className="mt-3 text-base leading-8 text-slate-500">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="badge-soft badge-blue">
                {order.status}
              </div>
              <div className="badge-soft badge-orange">
                {order.payment?.status || "UNPAID"} / {order.paymentMethod}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="section-card">
            <h2 className="heading-section text-2xl">Items</h2>
            <div className="mt-6 space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="surface-outline flex flex-col gap-4 bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-20 w-20 rounded-2xl bg-cover bg-center bg-slate-100"
                      style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }}
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-500">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand-blue">{formatMoney(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="section-card">
              <h2 className="heading-section text-2xl">Delivery</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Recipient</div>
                  <div className="mt-1 font-medium text-slate-900">{order.customerName || "N/A"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Phone</div>
                  <div className="mt-1 font-medium text-slate-900">{order.customerPhone || "N/A"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Location</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {[order.city, order.province].filter(Boolean).join(", ") || "N/A"}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Address</div>
                  <div className="mt-1 font-medium text-slate-900">{order.address || "N/A"}</div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="heading-section text-2xl">Summary</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatMoney(order.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/orders" className="button-blue">
                  Back to Orders
                </Link>
                {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
              </div>
            </div>

            <div className="section-card">
              <h2 className="heading-section text-2xl">Order Timeline</h2>
              <div className="mt-6 space-y-4">
                {order.timeline?.length ? (
                  order.timeline.map((entry) => (
                    <div key={entry.id} className="surface-outline bg-white">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-900">{formatLabel(entry.type)}</div>
                        <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="surface-card-muted border-dashed border-slate-300 px-5 py-8 text-sm text-slate-500">
                    Your order history updates will appear here as payment and delivery progress changes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
