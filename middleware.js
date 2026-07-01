import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const customerOnlyPaths = [
  "/account",
  "/cart",
  "/checkout",
  "/orders",
  "/products",
  "/robot-kits"
];

const authRequiredPaths = ["/account", "/orders", "/checkout"];

function isCustomerOnlyPath(pathname) {
  return customerOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthRequiredPath(pathname) {
  return authRequiredPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token && isAuthRequiredPath(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token?.role === "ADMIN" && isCustomerOnlyPath(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/robot-kits/:path*"
  ]
};
