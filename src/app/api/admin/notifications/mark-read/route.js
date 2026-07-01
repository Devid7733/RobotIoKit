import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAdminNotificationsRead } from "@/modules/admin/admin.service";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await markAdminNotificationsRead(session.user.id, body);

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to mark notifications read." },
      { status: error?.status || 500 }
    );
  }
}
