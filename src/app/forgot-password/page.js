import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ForgotPasswordForm from "@/components/storefront/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <main className="min-h-screen">
      <ForgotPasswordForm />
    </main>
  );
}
