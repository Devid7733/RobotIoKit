"use client";

export default function QuantityStepper({ quantity, onChange, min = 1, max }) {
  function updateQuantity(nextValue) {
    let clamped = Math.max(min, nextValue);
    if (typeof max === "number") {
      clamped = Math.min(max, clamped);
    }
    onChange(clamped);
  }

  const atMax = typeof max === "number" && quantity >= max;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => updateQuantity(quantity - 1)}
        disabled={quantity <= min}
        className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        -
      </button>
      <div className="flex h-9 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-semibold text-slate-900">
        {quantity}
      </div>
      <button
        type="button"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={atMax}
        className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
