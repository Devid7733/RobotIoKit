import { redirect } from "next/navigation";
import Link from "next/link";
import AccountAvatarUploader from "@/components/account/AccountAvatarUploader";
import Breadcrumb from "@/components/common/Breadcrumb";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { auth } from "@/lib/auth";
import { getAccountOverview } from "@/lib/accountQueries";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getShortOrderId(id) {
  return `#${String(id).slice(-8).toUpperCase()}`;
}

function getDisplayOrderNumber(order) {
  return order.orderNumber || getShortOrderId(order.id);
}

export const metadata = {
  title: "My Account | RobotIoKit",
  description: "View your RobotIoKit profile, delivery information, and recent orders."
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const overview = await getAccountOverview(session.user.id);

  if (!overview) {
    redirect("/login");
  }

  const { user, stats, recentOrders } = overview;
  const profileComplete = Boolean(user.name && user.phone && user.address);

  return (
    <StorefrontShell>
      <div className="storefront-container page-section">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />

        <section className="page-hero">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <AccountAvatarUploader user={user} />
              <div>
                <p className="page-kicker">My Account</p>
                <h1 className="page-title break-words">{user.name || "Customer Profile"}</h1>
                <p className="mt-2 break-all text-sm font-medium text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="surface-card-muted">
                <div className="text-sm uppercase tracking-[0.14em] text-slate-400">Orders</div>
                <div className="mt-2 font-display text-3xl font-semibold text-slate-900">{stats.orderCount}</div>
              </div>
              <div className="surface-card-muted">
                <div className="text-sm uppercase tracking-[0.14em] text-slate-400">Spent</div>
                <div className="mt-2 font-display text-3xl font-semibold text-slate-900">{formatMoney(stats.totalSpent)}</div>
              </div>
              <div className="surface-card-muted">
                <div className="text-sm uppercase tracking-[0.14em] text-slate-400">Open</div>
                <div className="mt-2 font-display text-3xl font-semibold text-slate-900">{stats.pendingOrders}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Profile Status</div>
              <div className="mt-2 font-semibold text-slate-900">
                {profileComplete ? "Ready for checkout" : "Needs delivery details"}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {profileComplete
                  ? "Your saved details can prefill future orders."
                  : "Add your name, phone, and address before your next order."}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Role</div>
              <div className="mt-2 font-semibold text-slate-900">{formatLabel(user.role)}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">Account permissions are set by the store.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Member Since</div>
              <div className="mt-2 font-semibold text-slate-900">{formatDate(user.createdAt)}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">Thanks for shopping with RobotIoKit.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.92fr,1.08fr]">
          <AccountProfileForm user={user} />

          <div className="section-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="heading-card">Recent Orders</h2>
              <Link href="/orders" className="text-sm font-semibold text-brand-blue">
                View all orders
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <h3 className="font-display text-xl font-semibold text-slate-900">No orders yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your recent robotics kits and IoT parts will appear here after checkout.
                  </p>
                  <Link href="/products" className="button-blue mt-5">
                    Browse products
                  </Link>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-[24px] border border-slate-200/80 p-5 transition hover:border-brand-blue/30 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{getDisplayOrderNumber(order)}</div>
                        <div className="mt-1 text-sm text-slate-500">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="badge-pill badge-blue">{formatLabel(order.status)}</div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
                      <span className="font-semibold text-slate-900">{formatMoney(order.total)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
