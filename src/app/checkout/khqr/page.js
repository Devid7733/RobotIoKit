import { notFound } from "next/navigation";
import KhqrPaymentActions from "@/components/storefront/KhqrPaymentActions";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getKhqrMerchantConfig } from "@/lib/khqr";
import { getKhqrPaymentOrder, renderKhqrPaymentImage } from "@/modules/order/order.service";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPaymentStatus(status) {
  if (status === "UNPAID") return "Unpaid";
  if (status === "PENDING_VERIFICATION") return "Waiting for admin verification";
  if (status === "PAID") return "Paid";
  if (status === "EXPIRED") return "Payment Expired";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

export default async function KhqrPage({ searchParams }) {
  const params = await searchParams;
  const orderId = params?.orderId || "";
  let order;

  try {
    order = await getKhqrPaymentOrder(orderId);
  } catch (error) {
    notFound();
  }

  const merchant = getKhqrMerchantConfig();
  const khqrPayment = await renderKhqrPaymentImage(order);
  order = khqrPayment.order;
  const amount = Number(order.total || 0);
  const paymentStatus = order.payment?.status || "UNPAID";
  const orderNumber = order.orderNumber || order.id;
  const paymentExpiresAt = order.payment?.paymentExpiresAt ? new Date(order.payment.paymentExpiresAt).toISOString() : null;

  return (
    <StorefrontShell>
      <div className="storefront-container page-section flex min-h-[70vh] items-center justify-center">
        <section className="w-full max-w-5xl">
          <div className="text-center">
            <p className="page-kicker">Digital Payment</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900">KHQR Payment</h1>
            <p className="mt-3 text-base text-slate-500">
              Scan the dynamic QR. The order total is embedded and payment is checked automatically through Bakong.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white shadow-[0_22px_55px_rgba(15,23,42,0.16)]">
              <div className="bg-red-600 px-6 py-4 text-center">
                <div className="text-xl font-bold tracking-wide text-white">KHQR</div>
              </div>
              <div className="relative bg-white px-7 py-6">
                <div className="absolute right-0 top-0 h-10 w-10 bg-red-600 [clip-path:polygon(100%_0,100%_100%,0_0)]" />
                <div className="text-sm font-medium text-slate-500">{merchant.merchantName}</div>
                <div className="mt-1 font-display text-4xl font-semibold tracking-tight text-slate-900">
                  {formatMoney(amount)}
                </div>
                <div className="my-6 border-t border-dashed border-slate-200" />
                <div className="mx-auto grid place-items-center">
                  <img
                    src={khqrPayment.qrImageDataUrl}
                    alt="RobotIoKit dynamic KHQR payment code"
                    className="h-64 w-64 object-contain"
                  />
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>Order Number</span>
                    <span className="font-semibold text-slate-900">{orderNumber}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span>Status</span>
                    <span className="font-semibold text-slate-900">{formatPaymentStatus(paymentStatus)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card h-fit">
              <h2 className="heading-section text-2xl">Automatic Payment Verification</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Scan with ABA, ACLEDA, Wing, Bakong, or any KHQR-supported app. After you pay, we will verify the transaction from Bakong before updating your order.
              </p>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
                This QR expires with this checkout session. If it expires, place the order again to receive a fresh dynamic KHQR.
              </div>
              <KhqrPaymentActions
                orderId={order.id}
                orderNumber={orderNumber}
                paymentExpiresAt={paymentExpiresAt}
                paymentStatus={paymentStatus}
              />
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
