import Link from "next/link";
import Icon from "@/components/common/Icon";
import StorefrontShell from "@/components/storefront/StorefrontShell";

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams;
  const orderId = params?.orderId || "ORD-UNKNOWN";
  const orderNumber = params?.orderNumber || orderId;
  const isPendingVerification = params?.payment === "pending-verification";

  return (
    <StorefrontShell>
      <div className="storefront-container page-section flex min-h-[70vh] items-center justify-center">
        <section className="surface-card w-full max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Icon name="checkCircle" className="h-12 w-12" />
          </div>
          <p className="page-kicker mt-8">Checkout Complete</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900">
            {isPendingVerification ? "Payment Submitted" : "Order Placed Successfully!"}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-500">
            {isPendingVerification
              ? "Thanks. Your KHQR payment is awaiting admin verification before the order moves into preparation."
              : "Thank you for your purchase. Your order has been received and will be processed shortly."}
          </p>
          <div className="surface-card-muted mt-8 px-6 py-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Order Number</div>
            <div className="mt-2 text-2xl font-semibold text-brand-blue">{orderNumber}</div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/orders" className="button-secondary flex-1 py-4">
              View My Orders
            </Link>
            <Link href="/products" className="button-blue flex-1 py-4 text-sm">
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
