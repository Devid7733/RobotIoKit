import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthForm from "@/components/storefront/AuthForm";

// Only allow same-site relative paths — a raw absolute/protocol-relative URL
// here would be an open-redirect vector since callbackUrl is user-controlled.
function sanitizeCallbackUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

export default async function LoginPage({ searchParams }) {
  const session = await auth();
  const callbackUrl = sanitizeCallbackUrl(searchParams?.callbackUrl);

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : callbackUrl || "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <AuthForm mode="login" callbackUrl={callbackUrl} />
    </main>
  );
}
