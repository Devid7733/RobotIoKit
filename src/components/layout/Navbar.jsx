"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Avatar from "@/components/common/Avatar";
import Icon from "@/components/common/Icon";
import { useCart } from "@/components/storefront/CartProvider";

function Logo() {
  return (
    <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
      Robot<span className="text-brand-orange">Io</span>Kit
    </Link>
  );
}

function isActivePath(pathname, href) {
  const path = pathname || "/";
  const target = href.split("?")[0];

  if (target === "/") {
    return path === "/";
  }

  return path === target || path.startsWith(`${target}/`);
}

export default function Navbar({ categories = [] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const { itemCount, isReady } = useCart();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const displayName = session?.user?.name || session?.user?.email || "customer";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;

      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target)) {
        setIsOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-blue/95 text-white shadow-lg shadow-brand-blue/15 backdrop-blur">
      <div className="storefront-container">
        <div className="flex min-h-[4.75rem] items-center gap-3 py-3">
          <Logo />
          <div ref={categoryMenuRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Categories
              <Icon
                name="chevronDown"
                className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen ? (
              <div className="absolute left-0 top-14 w-72 rounded-[24px] border border-slate-200 bg-white p-3 text-slate-700 shadow-2xl">
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                        isActivePath(pathname, category.href)
                          ? "bg-brand-mist text-brand-blue"
                          : "hover:bg-brand-mist"
                      }`}
                    >
                      <span className="rounded-xl bg-brand-mist p-2 text-brand-blue">
                        <Icon name={category.icon} className="h-4 w-4" />
                      </span>
                      <span className="text-base font-medium">{category.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            <Link
              href="/robot-kits"
              className={`rounded-full px-3 py-2 transition ${
                isActivePath(pathname, "/robot-kits")
                  ? "bg-white font-semibold text-brand-blue shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              Robot Kits
            </Link>
            <Link
              href="/products"
              className={`rounded-full px-3 py-2 transition ${
                isActivePath(pathname, "/products")
                  ? "bg-white font-semibold text-brand-blue shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Products
            </Link>
          </nav>
          <div className="ml-auto hidden flex-1 items-center justify-center px-4 lg:flex">
            <form action="/search" method="get" className="relative w-full max-w-lg">
              <input
                name="q"
                className="h-11 w-full rounded-2xl border border-white/12 bg-white/12 px-4 pr-12 text-sm text-white placeholder:text-slate-200 outline-none transition focus:border-white/35 focus:bg-white/15"
                placeholder="Search products, kits..."
                type="text"
              />
              <button
                type="submit"
                aria-label="Search store"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100"
              >
                <Icon name="search" className="h-5 w-5" />
              </button>
            </form>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="rounded-full border border-white/10 bg-white/8 p-2.5 transition hover:bg-white/12 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            {!isAdmin ? (
              <Link
                href="/cart"
                className={`relative rounded-full border border-white/10 p-2.5 transition ${
                  isActivePath(pathname, "/cart")
                    ? "bg-white/16 text-white ring-1 ring-white/20"
                    : "bg-white/8 hover:bg-white/12"
                }`}
              >
                <Icon name="cart" className="h-6 w-6" />
                {isReady && itemCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[11px] font-bold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 transition hover:bg-white/12"
              >
                {session?.user ? (
                  <Avatar
                    user={session.user}
                    className="h-6 w-6"
                    fallbackClassName="bg-white/20 text-[11px] font-bold text-white"
                  />
                ) : (
                  <Icon name="user" className="h-6 w-6" />
                )}
                {session?.user ? <span className="hidden max-w-24 truncate text-sm font-semibold sm:block">{displayName}</span> : null}
              </button>
              {isUserMenuOpen ? (
                <div className="absolute right-0 top-14 w-64 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl">
                  {session?.user ? (
                    <>
                      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                        <Avatar user={session.user} className="h-12 w-12 shrink-0" />
                        <div className="min-w-0 break-all text-lg font-semibold text-slate-900">{displayName}</div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {isAdmin ? (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium ${
                              isActivePath(pathname, "/admin")
                                ? "bg-brand-mist text-brand-blue"
                                : "hover:bg-brand-mist"
                            }`}
                          >
                            <Icon name="dashboard" className="h-5 w-5" />
                            Admin Dashboard
                          </Link>
                        ) : (
                          <>
                            <Link
                              href="/orders"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium ${
                                isActivePath(pathname, "/orders")
                                  ? "bg-brand-mist text-brand-blue"
                                  : "hover:bg-brand-mist"
                              }`}
                            >
                              <Icon name="package" className="h-5 w-5" />
                              My Orders
                            </Link>
                            <Link
                              href="/account"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium ${
                                isActivePath(pathname, "/account")
                                  ? "bg-brand-mist text-brand-blue"
                                  : "hover:bg-brand-mist"
                              }`}
                            >
                              <Icon name="user" className="h-5 w-5" />
                              My Account
                            </Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50"
                        >
                          <Icon name="logout" className="h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`block rounded-2xl px-4 py-3 text-base font-medium ${
                          isActivePath(pathname, "/login")
                            ? "bg-brand-mist text-brand-blue"
                            : "hover:bg-brand-mist"
                        }`}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`block rounded-2xl px-4 py-3 text-base font-semibold text-brand-blue ${
                          isActivePath(pathname, "/register") ? "bg-brand-mist" : "hover:bg-brand-mist"
                        }`}
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="pb-4 lg:hidden">
          <form action="/search" method="get" className="relative">
            <input
              name="q"
              className="h-11 w-full rounded-2xl border border-white/12 bg-white/12 px-4 pr-12 text-sm text-white placeholder:text-slate-200 outline-none"
              placeholder="Search products, kits..."
              type="text"
            />
            <button
              type="submit"
              aria-label="Search store"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100"
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex flex-none items-center justify-between bg-brand-blue px-5 py-4">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-2xl font-bold text-white">
                Robot<span className="text-brand-orange">Io</span>Kit
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15"
                aria-label="Close menu"
              >
                <Icon name="xCircle" className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <Link
                  href="/robot-kits"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition ${
                    isActivePath(pathname, "/robot-kits")
                      ? "bg-brand-mist text-brand-blue"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="chip" className="h-5 w-5" />
                  Robot Kits
                </Link>
                <Link
                  href="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition ${
                    isActivePath(pathname, "/products")
                      ? "bg-brand-mist text-brand-blue"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="bolt" className="h-5 w-5" />
                  All Products
                </Link>
              </div>

              {categories.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Categories
                  </div>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={category.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition ${
                          isActivePath(pathname, category.href)
                            ? "bg-brand-mist text-brand-blue"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="rounded-xl bg-brand-mist p-1.5 text-brand-blue">
                          <Icon name={category.icon} className="h-4 w-4" />
                        </span>
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
