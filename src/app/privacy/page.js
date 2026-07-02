import Breadcrumb from "@/components/common/Breadcrumb";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getPublicStoreSupportSettings } from "@/services/storeSupportService";

export const metadata = {
  title: "Privacy Notice | RobotIoKit",
  description: "How RobotIoKit collects, uses, and stores your information."
};

export default async function PrivacyPage() {
  let support = { storeName: "RobotIoKit", supportEmail: "", phoneNumber: "" };
  try {
    support = await getPublicStoreSupportSettings();
  } catch {
    // fall back to defaults above if settings can't be loaded
  }

  return (
    <StorefrontShell>
      <div className="storefront-container page-section max-w-3xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Notice" }]} />

        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Privacy Notice</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-6 text-slate-600">
          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">What information we collect</h2>
            <p className="mt-2">
              When you create an account, place an order, or contact us, we collect the information you provide directly:
              your name, email address, phone number, delivery address, and order details (items, quantities, prices).
              For KHQR payments, we record the payment status and reference returned by the Bakong payment network — we do
              not collect or store your bank card number, PIN, or banking credentials.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To process and deliver your orders, and to send order confirmation and status emails.</li>
              <li>To create and secure your account, including sending one-time verification codes and password-reset emails.</li>
              <li>To respond to support questions, including messages you send through our chat assistant.</li>
              <li>To improve our catalog, pricing, and service based on order and browsing activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Chat assistant</h2>
            <p className="mt-2">
              Our chat assistant can answer questions using an AI service to generate replies. Messages you send to the
              chat assistant, along with limited order details needed to answer order-status questions, may be sent to
              that AI service to generate a response. Avoid sharing sensitive information (such as passwords or full
              payment details) in chat messages.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">How we store and protect your information</h2>
            <p className="mt-2">
              Your data is stored in a managed PostgreSQL database with access restricted to store operations. Passwords
              are never stored in plain text. Uploaded images (such as your profile photo) are stored with a cloud file
              storage provider. We take reasonable technical measures to protect your information, but no online service
              can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Third parties we work with</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Bakong / National Bank of Cambodia — to verify KHQR payments.</li>
              <li>Our email provider — to send account and order emails.</li>
              <li>Our cloud hosting and file storage providers — to run the website and store uploaded images.</li>
              <li>Our AI chat provider — to generate chat assistant replies, as described above.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-slate-900">Your choices</h2>
            <p className="mt-2">
              You can review and update your account details at any time from your account page. To request a copy of
              your data, ask us to correct it, or ask us to delete your account and associated data, contact us using
              the details below.
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
