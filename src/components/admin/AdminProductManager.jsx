"use client";

import Icon from "@/components/common/Icon";
import MediaPicker from "@/components/admin/MediaPicker";
import { useMemo, useState } from "react";

const VOLTAGE_OPTIONS = ["3.3V", "3.7V", "4.8V", "5V", "6V", "7.4V", "9V", "12V", "24V"];

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  price: "",
  stock: "",
  voltages: [],
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

function getProductVoltages(product) {
  if (Array.isArray(product.voltages)) {
    return product.voltages;
  }

  return product.voltage ? [product.voltage] : [];
}

function formatVoltages(voltages) {
  return Array.isArray(voltages) && voltages.length ? voltages.join(", ") : "Not specified";
}

export default function AdminProductManager({ initialProducts, categories }) {
  const [products, setProducts] = useState(initialProducts);
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    ...emptyForm,
    categoryId: categories[0]?.id || ""
  });
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [inlineCategoryName, setInlineCategoryName] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.sku, product.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [products, query]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const response = await fetch("/api/categories", {
        cache: "no-store"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load categories.");
      }

      setCategoryOptions(result.data || []);
      return result.data || [];
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load categories.");
      return categoryOptions;
    } finally {
      setLoadingCategories(false);
    }
  }

  async function openCreateModal() {
    const latestCategories = await loadCategories();

    setForm({
      ...emptyForm,
      categoryId: latestCategories[0]?.id || ""
    });
    setError("");
    setOpen(true);
  }

  async function openEditModal(product) {
    const latestCategories = await loadCategories();

    setForm({
      id: product.id,
      name: product.name || "",
      slug: product.slug || "",
      sku: product.sku || "",
      categoryId: product.categoryId || latestCategories[0]?.id || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      voltages: getProductVoltages(product),
      image: product.image || "",
      description: product.description || "",
      featured: Boolean(product.featured)
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
        slug: form.slug || slugify(form.name)
      };

      const response = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to save product.");
      }

      setProducts((current) =>
        form.id
          ? current.map((product) => (product.id === form.id ? result.data : product))
          : [result.data, ...current]
      );
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInlineCategoryCreate() {
    if (!inlineCategoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setCreatingCategory(true);
      setError("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: inlineCategoryName.trim()
        })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to create category.");
      }

      setCategoryOptions((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((current) => ({ ...current, categoryId: result.data.id }));
      setInlineCategoryName("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create category.");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSelectedCategoryDelete() {
    if (!form.categoryId) {
      setError("Select a category to delete.");
      return;
    }

    const selectedCategory = categoryOptions.find((category) => category.id === form.categoryId);

    if (!selectedCategory) {
      setError("Selected category not found.");
      return;
    }

    const confirmed = window.confirm(`Delete category "${selectedCategory.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCategoryId(selectedCategory.id);
      setError("");

      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete category.");
      }

      const nextCategories = categoryOptions.filter((category) => category.id !== selectedCategory.id);
      setCategoryOptions(nextCategories);
      setForm((current) => ({
        ...current,
        categoryId: nextCategories[0]?.id || ""
      }));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete category.");
    } finally {
      setDeletingCategoryId("");
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm("Delete this product?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete product.");
      }

      setProducts((current) => current.filter((product) => product.id !== productId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product.");
    }
  }

  return (
    <section className="surface-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Products</h2>
          <p className="mt-2 text-sm text-slate-500">{products.length} products in catalog</p>
        </div>
        <button type="button" onClick={openCreateModal} className="button-blue px-5 py-2.5">
          Add Product
        </button>
      </div>

      <div className="surface-outline mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input-base max-w-sm"
          placeholder="Search products..."
          type="text"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Image</th>
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Category</th>
              <th className="px-5 py-4 font-semibold">Price</th>
              <th className="px-5 py-4 font-semibold">Stock</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-t border-slate-100 text-sm text-slate-700">
                <td className="px-5 py-4">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{product.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{product.sku || product.slug}</div>
                </td>
                <td className="px-5 py-4">{product.category?.name || "Uncategorized"}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">{formatMoney(product.price)}</td>
                <td className="px-5 py-4">
                  <span className="badge-pill badge-emerald">
                    {product.stock}
                  </span>
                  <div className="mt-2 text-xs text-slate-500">{formatVoltages(getProductVoltages(product))}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => openEditModal(product)} className="text-sm font-medium text-brand-blue">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(product.id)} className="text-sm font-medium text-red-500">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h3 className="font-display text-2xl font-semibold text-slate-900">
                {form.id ? "Edit Product" : "Add New Product"}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 transition hover:text-slate-700">
                x
              </button>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 grid gap-4 content-start">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Product Name
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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Category
                  <div className="flex items-start gap-2">
                    <select
                      value={form.categoryId}
                      onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                      className="input-base flex-1"
                      required
                    >
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSelectedCategoryDelete}
                      disabled={!form.categoryId || deletingCategoryId === form.categoryId || loadingCategories}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Delete selected category"
                      title="Delete selected category"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                  {loadingCategories ? <span className="text-xs text-slate-400">Refreshing categories...</span> : null}
                  {deletingCategoryId === form.categoryId ? <span className="text-xs text-slate-400">Deleting category...</span> : null}
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
                  Stock
                  <input
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                    className="input-base"
                    min="0"
                    step="1"
                    type="number"
                    required
                  />
                </label>
                <fieldset className="grid gap-3 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-4">
                  <legend>Compatible Voltages</legend>
                  <div className="grid gap-2 rounded-2xl border border-slate-200 p-4 sm:grid-cols-3">
                    {VOLTAGE_OPTIONS.map((voltage) => {
                      const checked = form.voltages.includes(voltage);

                      return (
                        <label key={voltage} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                voltages: event.target.checked
                                  ? [...current.voltages, voltage]
                                  : current.voltages.filter((item) => item !== voltage)
                              }))
                            }
                          />
                          {voltage}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="surface-card-muted border-dashed border-slate-300">
                <div className="text-sm font-medium text-slate-700">Missing a category?</div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={inlineCategoryName}
                    onChange={(event) => setInlineCategoryName(event.target.value)}
                    className="input-base"
                    placeholder="Create category name"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCategoryCreate}
                    disabled={creatingCategory}
                    className="button-secondary border-brand-blue text-brand-blue disabled:opacity-60"
                  >
                    {creatingCategory ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </div>

              <MediaPicker
                label="Product Image"
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
                Featured product
              </label>
            </form>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button type="button" onClick={() => setOpen(false)} className="button-secondary px-5 py-2.5">
                Cancel
              </button>
              <button type="submit" form="product-form" disabled={submitting} className="button-blue px-5 py-2.5 disabled:opacity-60">
                {submitting ? "Saving..." : form.id ? "Save Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
