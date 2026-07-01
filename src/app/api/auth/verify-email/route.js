import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";
import { verifyEmailOtp } from "@/modules/auth/auth.service";
import { mergeGuestCartIntoUserCart } from "@/modules/cart/cart.service";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function useSecureSessionCookie() {
  return Boolean(process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.VERCEL);
}

async function createSessionToken(user) {
  return encode({
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: SESSION_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    }
  });
}

function setSessionCookie(response, sessionToken) {
  const secure = useSecureSessionCookie();

  response.cookies.set({
    name: secure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

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
    const body = await request.json();
    const result = await verifyEmailOtp(body);

    if (body?.guestSessionId && result.user?.id && result.user?.role !== "ADMIN") {
      await mergeGuestCartIntoUserCart(result.user.id, body.guestSessionId);
    }

    const response = NextResponse.json({
      ok: true,
      message: result.alreadyVerified ? "Email is already verified." : "Email verified successfully.",
      data: {
        email: result.user.email,
        emailVerified: true,
        signedIn: true
      }
    });
    const sessionToken = await createSessionToken(result.user);
    setSessionCookie(response, sessionToken);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify email.";
    const status = message.includes("expired") ? 410 : message.includes("required") ? 400 : 422;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
