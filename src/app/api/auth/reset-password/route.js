import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { resetPassword } from "@/modules/auth/auth.service";

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const result = await resetPassword(await request.json());

    return NextResponse.json({
      ok: true,
      message: result.message
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset password.";
    const status = message.includes("required") || message.includes("Password must") ? 400 : 422;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
