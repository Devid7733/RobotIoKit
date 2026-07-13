"use client";

import { useEffect, useState } from "react";

export default function QuantityStepper({ quantity, onChange, min = 1, max, disabled = false }) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  function clamp(value) {
    let next = Math.max(min, value);
    if (typeof max === "number") {
      next = Math.min(max, next);
    }
    return next;
  }

  function step(delta) {
    onChange(clamp(quantity + delta));
  }

  function handleInputChange(event) {
    const raw = event.target.value;
    if (raw !== "" && !/^\d+$/.test(raw)) {
      return;
    }
    setText(raw);
    if (raw !== "") {
      onChange(clamp(Number(raw)));
    }
  }

  function handleBlur() {
    const parsed = Number(text);
    const next = clamp(text !== "" && Number.isFinite(parsed) ? parsed : min);
    setText(String(next));
    if (next !== quantity) {
      onChange(next);
    }
  }

  const atMax = typeof max === "number" && quantity >= max;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || quantity <= min}
        className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="h-9 w-14 border-x border-slate-200 px-1 text-center text-sm font-semibold text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || atMax}
        className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
