import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changeAdminPassword } from "@/modules/admin/admin.service";

import { toClientErrorMessage } from "@/lib/apiError";
async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function PATCH(request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const result = await changeAdminPassword(session.user.id, body);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to change password.") },
      { status: error?.status || 500 }
    );
  }
}
