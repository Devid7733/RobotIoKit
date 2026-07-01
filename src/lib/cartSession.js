import { cookies } from "next/headers";

export const CART_COOKIE_NAME = "robotiokit_cart_session";

function createSessionId() {
  return crypto.randomUUID();
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = createSessionId();
    cookieStore.set(CART_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return sessionId;
}

function getUserCartSessionId(userId) {
  return `user:${userId}`;
}

export { getUserCartSessionId };
