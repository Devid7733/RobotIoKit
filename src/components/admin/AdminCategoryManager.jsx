"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: ""
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");

  const fetchCategories = useCallback(async (search, currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/categories?${params}`);
      const json = await res.json();
      if (json.ok) {
        setCategories(json.data);
        setMeta(json.meta);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchCategories(query, 1);
    }, 300);
    return () => clearTimeout(id);
  }, [query, fetchCategories]);

  useEffect(() => {
    fetchCategories(query, page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreateModal() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEditModal(category) {
    setForm({
      id: category.id,
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || ""
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);

      const payload = {
        ...form,
        slug: form.slug || slugify(form.name)
      };

      const response = await fetch(form.id ? `/api/categories/${form.id}` : "/api/categories", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to save category.");
      }

      setOpen(false);
      toast.success(form.id ? "Category updated." : "Category created.");

      if (form.id) {
        fetchCategories(query, page);
      } else {
        setPage(1);
        fetchCategories(query, 1);
      }
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to save category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(categoryId) {
    const confirmed = window.confirm("Delete this category?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCategoryId(categoryId);

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete category.");
      }

      toast.success("Category deleted.");
      fetchCategories(query, page);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete category.");
    } finally {
      setDeletingCategoryId("");
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="heading-card">Categories</h2>
          <p className="mt-2 text-sm text-slate-500">{meta.total} categories in catalog</p>
        </div>
        <button type="button" onClick={openCreateModal} className="button-blue gap-2 self-start rounded-3xl px-7 py-3.5 text-base">
          <span className="text-xl leading-none">+</span>
          Add Category
        </button>
      </div>

      <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="relative max-w-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-700 outline-none transition focus:border-brand-blue/40"
            placeholder="Search categories..."
            type="text"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-200 bg-white text-sm uppercase tracking-[0.04em] text-slate-500">
            <tr>
              <th className="px-6 py-5 font-medium">Name</th>
              <th className="px-6 py-5 font-medium">Slug</th>
              <th className="px-6 py-5 font-medium">Products</th>
              <th className="px-6 py-5 font-medium">Description</th>
              <th className="px-6 py-5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  {query ? `No categories found for "${query}"` : "No categories yet."}
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-t border-slate-100 text-sm text-slate-700">
                  <td className="px-6 py-5 font-medium text-slate-900">{category.name}</td>
                  <td className="px-6 py-5 text-slate-500">{category.slug}</td>
                  <td className="px-6 py-5">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-brand-blue">
                      {category._count?.products || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500">{category.description || "No description"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-5">
                      <button type="button" onClick={() => openEditModal(category)} className="text-brand-blue transition hover:opacity-80" aria-label={`Edit ${category.name}`}>
                        <Icon name="wrench" className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingCategoryId === category.id}
                        className="text-rose-500 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Icon name="trash" className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue"
          >
            ‹
          </button>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
                p === page
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-blue hover:text-brand-blue"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue"
          >
            ›
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
              <h3 className="heading-card">
                {form.id ? "Edit Category" : "Add New Category"}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-3xl leading-none text-slate-400 transition hover:text-slate-700">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 px-8 py-8">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Category Name *
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-700 outline-none transition focus:border-brand-blue/40"
                  placeholder="e.g. Controllers"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-base text-slate-700 outline-none transition focus:border-brand-blue/40"
                  placeholder="auto-generated if left empty"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-32 rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-700 outline-none transition focus:border-brand-blue/40"
                  placeholder="Short category description..."
                />
              </label>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-3xl border border-slate-200 px-6 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-[#8ec0f7] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#79b2f2] disabled:opacity-60"
                >
                  {submitting ? "Saving..." : form.id ? "Save Category" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
