"use client";

import Icon from "@/components/common/Icon";
import { useState } from "react";
import { toast } from "sonner";

export default function MediaPicker({ value, onChange, label = "Image" }) {
  const [open, setOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState("");
  const [manualUrl, setManualUrl] = useState(value || "");

  async function loadMedia() {
    try {
      setLoading(true);

      const response = await fetch("/api/media", {
        cache: "no-store"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load media.");
      }

      setMediaItems(result.data || []);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load media.");
    } finally {
      setLoading(false);
    }
  }

  async function openPicker() {
    setManualUrl(value || "");
    setOpen(true);
    await loadMedia();
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);

      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/media", {
        method: "POST",
        body
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to upload image.");
      }

      setMediaItems((current) => [result.data, ...current]);
      onChange(result.data.url);
      setManualUrl(result.data.url);
      toast.success("Image uploaded.");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(item) {
    const usageList = [
      ...(item.products || []).map((product) => `Product: ${product.name}`),
      ...(item.robotKits || []).map((kit) => `Robot kit: ${kit.name}`)
    ];
    const warning = item.inUse
      ? `\n\nThis image is in use by:\n${usageList.join("\n")}\n\nDelete anyway?`
      : "";
    const confirmed = window.confirm(`Delete "${item.name}" from media library?${warning}`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingName(item.name);

      let response = await fetch(`/api/media?url=${encodeURIComponent(item.url)}`, {
        method: "DELETE"
      });
      let result = await response.json();

      if (response.status === 409 && result.data?.inUse) {
        const forceConfirmed = window.confirm(
          `This image is still referenced by existing records.\n\n${[
            ...(result.data.products || []).map((product) => `Product: ${product.name}`),
            ...(result.data.robotKits || []).map((kit) => `Robot kit: ${kit.name}`)
          ].join("\n")}\n\nForce delete this file anyway?`
        );

        if (!forceConfirmed) {
          return;
        }

        response = await fetch(`/api/media?url=${encodeURIComponent(item.url)}&force=1`, {
          method: "DELETE"
        });
        result = await response.json();
      }

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete image.");
      }

      setMediaItems((current) => current.filter((media) => media.name !== item.name));

      if (value === item.url) {
        onChange("");
        setManualUrl("");
      }
      toast.success("Image deleted.");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete image.");
    } finally {
      setDeletingName("");
    }
  }

  return (
    <>
      <div className="grid gap-2 text-sm font-medium text-slate-700">
        <div>{label}</div>
        <div className="surface-card-muted flex flex-col gap-3">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white shadow-sm">
              {value ? (
                <img src={value} alt="Selected media" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
              )}
            </div>

            <div className="flex flex-1 flex-wrap gap-3">
              <button type="button" onClick={openPicker} className="button-secondary border-brand-blue px-4 py-2.5 text-brand-blue">
                Open Media Picker
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="button-secondary px-4 py-2.5"
                >
                  Remove Image
                </button>
              ) : null}
            </div>
          </div>
          <div className="text-xs text-slate-400">{value || "Upload an image or pick one from the library."}</div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="surface-card w-full max-w-4xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-slate-900">Media Picker</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 transition hover:text-slate-700">
                x
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-brand-blue bg-brand-blue/5 px-4 py-5 text-sm font-semibold text-brand-blue">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  {uploading ? "Uploading..." : "Upload Image"}
                </label>

                <div className="surface-outline">
                  <div className="text-sm font-medium text-slate-700">Manual URL</div>
                  <input
                    value={manualUrl}
                    onChange={(event) => setManualUrl(event.target.value)}
                    className="input-base mt-3"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onChange(manualUrl.trim());
                      setOpen(false);
                    }}
                    className="button-secondary mt-3 w-full"
                  >
                    Use This URL
                  </button>
                </div>
              </div>

              <div>
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : mediaItems.length === 0 ? (
                  <div className="surface-card-muted p-8 text-center text-sm text-slate-500">
                    No uploaded images yet.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mediaItems.map((item) => (
                      <div
                        key={item.url}
                        className={`overflow-hidden rounded-2xl border transition ${
                          value === item.url ? "border-brand-blue shadow-[0_0_0_2px_rgba(37,99,235,0.15)]" : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onChange(item.url);
                            setManualUrl(item.url);
                            setOpen(false);
                          }}
                          className="block w-full text-left"
                        >
                          <div className="h-36 bg-slate-100">
                            <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        </button>
                        <div className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-xs text-slate-500">{item.name}</div>
                            {item.inUse ? (
                              <div className="badge-pill badge-amber mt-1">
                                In use by {(item.products?.length || 0) + (item.robotKits?.length || 0)} record(s)
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingName === item.name}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
