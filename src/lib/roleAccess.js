import { NextResponse } from "next/server";

export function isAdminSession(session) {
  return session?.user?.role === "ADMIN";
}

export function adminCustomerForbiddenResponse() {
  return NextResponse.json(
    { ok: false, message: "Admins cannot access customer checkout pages." },
    { status: 403 }
  );
}
