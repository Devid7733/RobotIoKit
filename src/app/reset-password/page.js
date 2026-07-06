import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ResetPasswordForm from "@/components/storefront/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }) {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  const params = await searchParams;
  const initialEmail = typeof params?.email === "string" ? params.email : "";

  return (
    <main className="min-h-screen">
      <ResetPasswordForm initialEmail={initialEmail} />
    </main>
  );
}
