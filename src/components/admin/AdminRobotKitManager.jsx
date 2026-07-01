"use client";

import MediaPicker from "@/components/admin/MediaPicker";
import { useMemo, useState } from "react";

const levels = ["Beginner", "Intermediate", "Advanced"];
const emptyForm = {
  id: "",
  name: "",
  slug: "",
  sku: "",
  price: "",
  level: "Beginner",
  stockQuantity: "0",
  image: "",
  description: "",
  featured: false
};

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function levelTone(level) {
  if (level === "Advanced") {
    return "badge-level-advanced";
  }
  if (level === "Intermediate") {
    return "badge-level-intermediate";
  }
  return "badge-level-beginner";
}

export default function AdminRobotKitManager({ initialRobotKits }) {
  const [robotKits, setRobotKits] = useState(initialRobotKits);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    ...emptyForm
  });
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredRobotKits = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return robotKits;
    }

    return robotKits.filter((kit) =>
      [kit.name, kit.sku, kit.level]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [robotKits, query]);

  async function openCreateModal() {
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEditModal(kit) {
    setForm({
      id: kit.id,
      name: kit.name || "",
      slug: kit.slug || "",
      sku: kit.sku || "",
      price: String(kit.price ?? ""),
      level: kit.level || "Beginner",
      stockQuantity: String(kit.stockQuantity ?? 0),
      image: kit.image || "",
      description: kit.description || "",
      featured: Boolean(kit.featured)
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        stockQuantity: Number(form.stockQuantity ?? 0)
      };

      const response = await fetch(form.id ? `/api/robot-kits/${form.id}` : "/api/robot-kits", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to save robot kit.");
      }

      setRobotKits((current) => (form.id ? current.map((kit) => (kit.id === form.id ? result.data : kit)) : [result.data, ...current]));
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save robot kit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(kitId) {
    const confirmed = window.confirm("Delete this robot kit?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/robot-kits/${kitId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete robot kit.");
      }

      setRobotKits((current) => current.filter((kit) => kit.id !== kitId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete robot kit.");
    }
  }

  return (
    <section className="surface-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Robot Kits</h2>
          <p className="mt-2 text-sm text-slate-500">{robotKits.length} kits available</p>
        </div>
        <button type="button" onClick={openCreateModal} className="button-blue px-5 py-2.5">
          Add Kit
        </button>
      </div>

      <div className="surface-outline mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input-base max-w-sm"
          placeholder="Search robot kits..."
          type="text"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredRobotKits.map((kit) => (
          <article key={kit.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <div className="relative h-56 bg-slate-100">
              {kit.image ? (
                <img src={kit.image} alt={kit.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
              )}
              <span className={`absolute right-4 top-4 badge-pill ${levelTone(kit.level)}`}>
                {kit.level}
              </span>
            </div>
            <div className="p-5">
              <div className="font-semibold text-slate-900">{kit.name}</div>
              <div className={`mt-2 text-sm font-medium ${Number(kit.stockQuantity || 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {Number(kit.stockQuantity || 0) > 0 ? `${kit.stockQuantity} in stock` : "Out of stock"}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xl font-semibold text-brand-blue">{formatMoney(kit.price)}</div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => openEditModal(kit)} className="text-sm font-medium text-brand-blue">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(kit.id)} className="text-sm font-medium text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h3 className="font-display text-2xl font-semibold text-slate-900">
                {form.id ? "Edit Robot Kit" : "Add New Robot Kit"}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 transition hover:text-slate-700">
                x
              </button>
            </div>

            <form id="kit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 grid gap-4 content-start">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Kit Name
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="input-base"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  SKU
                  <input
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                    className="input-base"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Difficulty
                  <select
                    value={form.level}
                    onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
                    className="input-base"
                    required
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Price ($)
                  <input
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    className="input-base"
                    min="0"
                    step="0.01"
                    type="number"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Stock Quantity
                  <input
                    value={form.stockQuantity}
                    onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                    className="input-base"
                    min="0"
                    step="1"
                    type="number"
                    required
                  />
                </label>
              </div>

              <MediaPicker
                label="Kit Image"
                value={form.image}
                onChange={(image) => setForm((current) => ({ ...current, image }))}
              />

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="input-base min-h-28"
                  required
                />
              </label>

              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  checked={form.featured}
                  onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                  type="checkbox"
                />
                Featured robot kit
              </label>
            </form>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button type="button" onClick={() => setOpen(false)} className="button-secondary px-5 py-2.5">
                Cancel
              </button>
              <button type="submit" form="kit-form" disabled={submitting} className="button-blue px-5 py-2.5 disabled:opacity-60">
                {submitting ? "Saving..." : form.id ? "Save Kit" : "Add Kit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
