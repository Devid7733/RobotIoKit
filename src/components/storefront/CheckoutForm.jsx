"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";
import { useCart } from "@/components/storefront/CartProvider";
import { getDeliveryFee } from "@/lib/deliveryFee";
import { CAMBODIA_PROVINCES } from "@/lib/provinces";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function CheckoutForm({ initialProfile }) {
  const { items, subtotal, refreshCart, isReady } = useCart();
  const router = useRouter();
  const checkoutKeyRef = useRef(null);
  const fullNameRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const fulfillmentRef = useRef(null);
  const paymentRef = useRef(null);
  const fieldRefs = {
    fullName: fullNameRef,
    phone: phoneRef,
    address: addressRef,
    fulfillmentMethod: fulfillmentRef,
    paymentMethod: paymentRef
  };
  const [form, setForm] = useState({
    fullName: initialProfile?.fullName || "",
    phone: initialProfile?.phone || "",
    email: initialProfile?.email || "",
    province: initialProfile?.province || "Phnom Penh",
    address: initialProfile?.address || "",
    note: ""
  });
  const [fulfillmentMethod, setFulfillmentMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = useMemo(
    () => (fulfillmentMethod === "delivery" ? getDeliveryFee(form.province) : 0),
    [form.province, fulfillmentMethod]
  );
  const total = subtotal + deliveryFee;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
  }

  const fieldOrder = ["fullName", "phone", "address", "fulfillmentMethod", "paymentMethod"];

  function validate() {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    if (fulfillmentMethod === "delivery" && !form.address.trim()) {
      errors.address = "Delivery address is required.";
    }
    if (!fulfillmentMethod) errors.fulfillmentMethod = "Please select a fulfillment method.";
    if (!paymentMethod) errors.paymentMethod = "Please select a payment method.";
    setFieldErrors(errors);
    return errors;
  }

  async function submitOrder(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const errors = validate();
    const firstErrorField = fieldOrder.find((field) => errors[field]);

    if (firstErrorField) {
      toast.error(errors[firstErrorField]);
      const target = fieldRefs[firstErrorField]?.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus?.();
      return;
    }

    setIsSubmitting(true);

    try {
      if (!checkoutKeyRef.current) {
        checkoutKeyRef.current = crypto.randomUUID();
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          fulfillmentMethod,
          checkoutKey: checkoutKeyRef.current,
          paymentMethod: paymentMethod === "khqr" ? "KHQR" : "CASH_ON_DELIVERY"
        })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to place order.");
      }

      await refreshCart();

      if (paymentMethod === "khqr") {
        router.push(`/checkout/khqr?orderId=${result.data.id}`);
      } else {
        const orderNumber = encodeURIComponent(result.data.orderNumber || result.data.id);
        router.push(`/checkout/success?orderId=${result.data.id}&orderNumber=${orderNumber}`);
      }
    } catch (error) {
      checkoutKeyRef.current = null;
      toast.error(error instanceof Error ? error.message : "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return <div className="section-card">Loading checkout...</div>;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr,380px]">
      <section className="space-y-6">
        <div className="max-w-2xl">
          <p className="page-kicker">Checkout</p>
          <h1 className="page-title">Checkout</h1>
        </div>

        {items.length === 0 ? (
          <div className="surface-card border-dashed border-slate-300 px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-semibold text-slate-900">No items in checkout</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Add products to your cart first, then return here to place the order.
            </p>
            <Link href="/products" className="button-blue mt-6">
              Browse products
            </Link>
          </div>
        ) : (
          <form onSubmit={submitOrder} className="space-y-6">
            <div className="section-card">
              <h2 className="heading-section text-2xl">Delivery Information</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    ref={fullNameRef}
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    className={`input-base ${fieldErrors.fullName ? "border-red-400" : ""}`}
                    placeholder="Your full name"
                    type="text"
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input
                    ref={phoneRef}
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    className={`input-base ${fieldErrors.phone ? "border-red-400" : ""}`}
                    placeholder="+855 12 000 000"
                    type="text"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address {fulfillmentMethod === "pickup" ? "(optional for store pickup)" : ""}
                </label>
                <input
                  ref={addressRef}
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  className={`input-base ${fieldErrors.address ? "border-red-400" : ""}`}
                  placeholder="Street address..."
                  type="text"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Province</label>
                <select name="province" value={form.province} onChange={updateField} className="input-base">
                  {CAMBODIA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div ref={fulfillmentRef} tabIndex={-1} className="section-card">
              <h2 className="heading-section text-2xl">Fulfillment Method</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentMethod("delivery");
                    setFieldErrors((current) => ({ ...current, fulfillmentMethod: "" }));
                  }}
                  className={`rounded-[20px] border p-5 text-left transition ${
                    fulfillmentMethod === "delivery" ? "border-brand-blue bg-brand-mist ring-2 ring-brand-blue/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-brand-blue p-3 text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]">
                      <Icon name="radio" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">Delivery</div>
                      <div className="mt-1 text-sm text-slate-500">{formatMoney(deliveryFee)} - {form.province}</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentMethod("pickup");
                    setFieldErrors((current) => ({ ...current, fulfillmentMethod: "" }));
                  }}
                  className={`rounded-[20px] border p-5 text-left transition ${
                    fulfillmentMethod === "pickup" ? "border-brand-blue bg-brand-mist ring-2 ring-brand-blue/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-slate-100 p-3 text-slate-500">
                      <Icon name="store" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">Store Pickup</div>
                      <div className="mt-1 text-sm text-slate-500">Free - Street 271, Phnom Penh</div>
                    </div>
                  </div>
                </button>
              </div>
              {fieldErrors.fulfillmentMethod && (
                <p className="mt-2 text-xs text-red-500">{fieldErrors.fulfillmentMethod}</p>
              )}
            </div>

            <div ref={paymentRef} tabIndex={-1} className="section-card">
              <h2 className="heading-section text-2xl">Payment Method</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("cod");
                    setFieldErrors((current) => ({ ...current, paymentMethod: "" }));
                  }}
                  className={`rounded-[20px] border p-5 text-left transition ${
                    paymentMethod === "cod" ? "border-brand-orange bg-orange-50 ring-2 ring-brand-orange/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-brand-orange p-3 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]">
                      <Icon name="creditCard" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">Cash on Delivery</div>
                      <div className="mt-1 text-sm text-slate-500">Pay when you receive</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("khqr");
                    setFieldErrors((current) => ({ ...current, paymentMethod: "" }));
                  }}
                  className={`rounded-[20px] border p-5 text-left transition ${
                    paymentMethod === "khqr" ? "border-brand-orange bg-orange-50 ring-2 ring-brand-orange/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-slate-100 p-3 text-slate-500">
                      <Icon name="creditCard" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">KHQR Payment</div>
                      <div className="mt-1 text-sm text-slate-500">Instant QR payment</div>
                    </div>
                  </div>
                </button>
              </div>
              {fieldErrors.paymentMethod && (
                <p className="mt-2 text-xs text-red-500">{fieldErrors.paymentMethod}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Order Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={updateField}
                className="input-base min-h-24 resize-none"
                placeholder="Optional note for delivery or order handling"
              />
            </div>
          </form>
        )}
      </section>

      <aside className="section-card h-fit">
        <h2 className="heading-section text-2xl">Order Summary</h2>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl bg-cover bg-center bg-slate-100"
                  style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }}
                />
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">x{item.qty}</div>
                </div>
              </div>
              <div className="font-semibold text-slate-900">{formatMoney(item.qty * item.price)}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery Fee</span>
            <span>{formatMoney(deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between text-2xl font-semibold text-slate-900">
            <span>Total</span>
            <span className="text-brand-blue">{formatMoney(total)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={submitOrder}
          disabled={isSubmitting || items.length === 0}
          className="button-primary mt-6 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Placing order..." : "Place Order"}
        </button>
        <p className="mt-4 text-xs leading-6 text-slate-500">
          Fulfillment: {fulfillmentMethod ? (fulfillmentMethod === "delivery" ? "Delivery" : "Store Pickup") : "Not selected"} - Payment:{" "}
          {paymentMethod ? (paymentMethod === "khqr" ? "KHQR" : "Cash on Delivery") : "Not selected"}
        </p>
      </aside>
    </div>
  );
}
