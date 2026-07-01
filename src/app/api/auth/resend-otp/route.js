import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { resendEmailOtp } from "@/modules/auth/auth.service";

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
    const result = await resendEmailOtp(await request.json());

    return NextResponse.json({
      ok: true,
      message: result.alreadyVerified ? "Email is already verified." : "A new verification code has been sent.",
      data: {
        alreadyVerified: result.alreadyVerified,
        otpExpiresAt: result.expiresAt ? result.expiresAt.toISOString() : null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resend verification code.";
    const status = message.includes("wait") ? 429 : message.includes("required") ? 400 : 422;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
