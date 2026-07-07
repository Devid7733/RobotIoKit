import Breadcrumb from "@/components/common/Breadcrumb";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getPublicStoreSupportSettings } from "@/services/storeSupportService";

export const metadata = {
  title: "Terms of Service | RobotIoKit",
  description: "The terms that govern your use of RobotIoKit and your orders with us."
};

export default async function TermsPage() {
  let support = { storeName: "RobotIoKit", supportEmail: "", phoneNumber: "" };
  try {
    support = await getPublicStoreSupportSettings();
  } catch {
    // fall back to defaults above if settings can't be loaded
  }

  return (
    <StorefrontShell>
      <div className="storefront-container page-section max-w-3xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-6 text-slate-600">
          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Accounts</h2>
            <p className="mt-2">
              You must provide accurate information when you register. New accounts must verify their email address
              with a one-time code before they're fully active. You're responsible for keeping your password secure
              and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Orders & payment</h2>
            <p className="mt-2">
              Orders can be paid by KHQR (via the Bakong payment network) or Cash on Delivery. KHQR payments must be
              completed within the checkout countdown window — if it expires, the order is cancelled and you'll need
              to place it again. For KHQR orders, our team verifies your payment proof before the order is marked as
              paid.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Pricing & availability</h2>
            <p className="mt-2">
              Prices and stock levels are subject to change without notice. If an item becomes unavailable after you've
              ordered it, we may adjust or cancel the affected part of your order and will let you know.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Order cancellation</h2>
            <p className="mt-2">
              You can cancel an order yourself from your account only while it's still Pending. Once an order has moved
              to Preparing, Shipped, or beyond, contact us using the details below and we'll help.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Limitation of liability</h2>
            <p className="mt-2">
              We take reasonable steps to keep our catalog, pricing, and order information accurate, and to deliver
              orders as described at checkout, but we can't guarantee an uninterrupted or error-free service. To the
              extent permitted by law, RobotIoKit isn't liable for indirect or incidental losses arising from your use
              of the site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use of RobotIoKit after a change means you accept
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Contact us</h2>
            <p className="mt-2">
              {support.storeName || "RobotIoKit"}
              {support.supportEmail ? (
                <>
                  {" "}
                  — Email:{" "}
                  <a href={`mailto:${support.supportEmail}`} className="text-brand-blue hover:underline">
                    {support.supportEmail}
                  </a>
                </>
              ) : null}
              {support.phoneNumber ? <> — Phone: {support.phoneNumber}</> : null}
            </p>
          </section>
        </div>
      </div>
    </StorefrontShell>
  );
}
