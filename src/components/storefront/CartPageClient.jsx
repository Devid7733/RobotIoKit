"use client";

import Link from "next/link";
import Icon from "@/components/common/Icon";
import { useCart } from "@/components/storefront/CartProvider";

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

export default function CartPageClient() {
  const { items, isReady, subtotal, itemCount, updateQuantity, removeItem } = useCart();

  if (!isReady) {
    return <div className="section-card">Loading cart...</div>;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr,360px]">
      <section className="section-card">
        <h1 className="page-title mt-0">Your shopping cart</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          Shared cart state is now persisted locally and used across product detail, cart, and checkout.
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Icon name="cart" className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Add components or robot kits to start checkout.
            </p>
            <Link href="/products" className="button-blue mt-6">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex flex-col gap-4 rounded-[24px] border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-20 w-20 rounded-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.category}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.qty - 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.qty + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-lg font-bold text-brand-blue">
                    {formatMoney(item.price * item.qty)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="section-card h-fit">
        <h2 className="heading-section text-2xl">Summary</h2>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className={`button-blue mt-6 w-full ${items.length === 0 ? "pointer-events-none opacity-60" : ""}`}
        >
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
