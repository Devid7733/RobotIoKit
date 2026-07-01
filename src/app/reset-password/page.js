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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <ResetPasswordForm initialEmail={initialEmail} />
    </main>
  );
}
