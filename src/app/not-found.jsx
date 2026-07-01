import Link from "next/link";
import StorefrontShell from "@/components/storefront/StorefrontShell";

export default function NotFound() {
  return (
    <StorefrontShell>
      <div className="storefront-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="text-7xl font-bold text-slate-200">404</div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="button-primary mt-8 px-6 py-3">Back to Store</Link>
      </div>
    </StorefrontShell>
  );
}
