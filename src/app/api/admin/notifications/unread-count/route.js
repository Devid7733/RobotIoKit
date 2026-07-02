import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadAdminNotificationCount } from "@/modules/admin/admin.service";

import { toClientErrorMessage } from "@/lib/apiError";
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const unreadCount = await getUnreadAdminNotificationCount(session.user.id);

    return NextResponse.json({
      ok: true,
      data: { unreadCount }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to load notifications.") },
      { status: 500 }
    );
  }
}
