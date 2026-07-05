import { auth } from "@/lib/auth";
import { getAccountOverview } from "@/lib/accountQueries";
import Breadcrumb from "@/components/common/Breadcrumb";
import CheckoutForm from "@/components/storefront/CheckoutForm";
import StorefrontShell from "@/components/storefront/StorefrontShell";

export const metadata = {
  title: "Checkout | RobotIoKit",
  description: "Enter your delivery details and pay via KHQR to complete your RobotIoKit order."
};

export default async function CheckoutPage() {
  const session = await auth();
  const overview = session?.user ? await getAccountOverview(session.user.id) : null;
  const profile = overview?.user
    ? {
        fullName: overview.user.name || "",
        phone: overview.user.phone || "",
        email: overview.user.email || "",
        province: overview.user.province || "Phnom Penh",
        address: overview.user.address || ""
      }
    : null;

  return (
    <StorefrontShell>
      <div className="storefront-container page-section">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" }
          ]}
        />
        <CheckoutForm initialProfile={profile} />
      </div>
    </StorefrontShell>
  );
}
