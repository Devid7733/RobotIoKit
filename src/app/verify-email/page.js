import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import VerifyEmailForm from "@/components/storefront/VerifyEmailForm";

export default async function VerifyEmailPage({ searchParams }) {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  const params = await searchParams;
  const initialEmail = typeof params?.email === "string" ? params.email : "";

  return (
    <main className="min-h-screen">
      <VerifyEmailForm initialEmail={initialEmail} />
    </main>
  );
}
