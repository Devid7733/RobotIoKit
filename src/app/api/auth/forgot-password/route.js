import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { requestPasswordReset } from "@/modules/auth/auth.service";

const GENERIC_MESSAGE = "If an account exists, we sent a password reset code.";

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
    const result = await requestPasswordReset(await request.json());

    return NextResponse.json({
      ok: true,
      message: result.message || GENERIC_MESSAGE
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request password reset.";

    if (message.includes("required")) {
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }

    console.error("Unable to send password reset email", error);
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }
}
