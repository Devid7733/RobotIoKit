import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

const handler = NextAuth(authOptions);

async function rateLimitedHandler(req, ctx) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  return handler(req, ctx);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
