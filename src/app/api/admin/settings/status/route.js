import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminSettingsStatus } from "@/modules/admin/admin.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const status = await getAdminSettingsStatus();

    return NextResponse.json({
      ok: true,
      data: status
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load settings status." },
      { status: 500 }
    );
  }
}
