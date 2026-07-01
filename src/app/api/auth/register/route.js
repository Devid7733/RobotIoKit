import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { registerUser } from "@/modules/auth/auth.service";

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
    const { user, expiresAt, emailSent } = await registerUser(await request.json());

    return NextResponse.json(
      {
        ok: true,
        message: emailSent
          ? "Account created. Please verify your email."
          : "Account created, but the verification email could not be sent. Please request a new code.",
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: Boolean(user.emailVerified),
          otpExpiresAt: expiresAt ? expiresAt.toISOString() : null
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register.";
    const status = message.includes("already exists") ? 409 : message.includes("required") ? 400 : 500;

    return NextResponse.json(
      {
        ok: false,
        message
      },
      { status }
    );
  }
}
