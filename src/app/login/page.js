import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthForm from "@/components/storefront/AuthForm";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <AuthForm mode="login" />
    </main>
  );
}
