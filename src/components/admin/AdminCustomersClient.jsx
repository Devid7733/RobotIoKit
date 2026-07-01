"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/common/Icon";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-CA");
}

export default function AdminCustomersClient() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async (search, currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const json = await res.json();
      if (json.ok) {
        setCustomers(json.data);
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
      fetchCustomers(query, 1);
    }, 300);
    return () => clearTimeout(id);
  }, [query, fetchCustomers]);

  useEffect(() => {
    fetchCustomers(query, page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Icon name="search" className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-64 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <p className="text-sm text-slate-500">{meta.total} customer{meta.total === 1 ? "" : "s"}</p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.045)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Phone</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-5 py-3.5">Orders</th>
              <th className="px-5 py-3.5">Verified</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                  {query ? `No customers found for "${query}"` : "No customers yet."}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{customer.name || "—"}</div>
                    <div className="text-xs text-slate-500">{customer.email}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{customer.phone || "—"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {[customer.city, customer.province].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-blue/10 px-2 text-xs font-semibold text-brand-blue">
                      {customer._count?.orders ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {customer.emailVerified ? (
                      <span className="badge-soft badge-emerald">Verified</span>
                    ) : (
                      <span className="badge-soft badge-amber">Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(customer.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders?customer=${encodeURIComponent(customer.email)}`}
                      className="text-xs font-semibold text-brand-blue hover:underline"
                    >
                      View Orders
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
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
    </div>
  );
}
