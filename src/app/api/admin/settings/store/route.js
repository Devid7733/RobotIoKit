import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminStoreSettings, updateAdminStoreSettings } from "@/modules/admin/admin.service";

import { toClientErrorMessage } from "@/lib/apiError";
async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const settings = await getAdminStoreSettings();
    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to load store settings.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const settings = await updateAdminStoreSettings(body);
    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to save store settings.") },
      { status: error?.status || 500 }
    );
  }
}
