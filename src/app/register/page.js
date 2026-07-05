import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthForm from "@/components/storefront/AuthForm";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <main className="min-h-screen">
      <AuthForm mode="register" />
    </main>
  );
}
