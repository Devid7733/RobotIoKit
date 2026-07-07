import Breadcrumb from "@/components/common/Breadcrumb";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getPublicStoreSupportSettings } from "@/services/storeSupportService";

export const metadata = {
  title: "Refund & Shipping Policy | RobotIoKit",
  description: "How delivery, order cancellation, and refunds work at RobotIoKit."
};

export default async function RefundPolicyPage() {
  let support = { storeName: "RobotIoKit", supportEmail: "", phoneNumber: "" };
  try {
    support = await getPublicStoreSupportSettings();
  } catch {
    // fall back to defaults above if settings can't be loaded
  }

  return (
    <StorefrontShell>
      <div className="storefront-container page-section max-w-3xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Refund & Shipping Policy" }]} />

        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Refund & Shipping Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-6 text-slate-600">
          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Delivery options & fees</h2>
            <p className="mt-2">
              At checkout you can choose Store Pickup (free, from our Phnom Penh location) or Delivery. Delivery fees
              depend on your province: $1.50 within Phnom Penh, $2.50 for all other provinces.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Order cancellation & refunds</h2>
            <p className="mt-2">
              You can cancel an order yourself from your account only while it's still Pending. For Cash on Delivery
              orders, cancelling before delivery means you're never charged. For KHQR orders where payment has already
              been verified before you cancel, contact us using the details below and we'll arrange a refund manually —
              refunds aren't processed automatically.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Delivery timing</h2>
            <p className="mt-2">
              We aim to prepare and dispatch orders promptly, but delivery times can vary by province, item
              availability, and courier conditions. We don't guarantee a fixed delivery window.
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
