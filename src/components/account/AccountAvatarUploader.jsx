"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxAvatarSize = 2 * 1024 * 1024;

function getInitials(user) {
  const source = user.name || user.email || "Customer";
  const parts = source.replace(/@.*/, "").split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AccountAvatarUploader({ user }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || user.image || "");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayedAvatar = previewUrl || avatarUrl;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setSelectedFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function selectAvatar(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedAvatarTypes.has(file.type)) {
      toast.error("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size >= maxAvatarSize) {
      toast.error("Avatar image must be smaller than 2MB.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar() {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to upload avatar.");
      }

      setAvatarUrl(result.data.avatarUrl || "");
      resetSelection();
      toast.success("Profile photo updated.");
      router.refresh();
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:items-center">
      <div className="relative h-20 w-20 shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="group flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-blue text-2xl font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] ring-1 ring-slate-200 transition hover:ring-brand-blue/40 disabled:cursor-wait disabled:opacity-70"
          aria-label="Upload profile photo"
        >
          {displayedAvatar ? (
            <img src={displayedAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(user)
          )}
          <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100">
            Change
          </span>
        </button>
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-xs font-semibold text-brand-blue">
            Saving
          </div>
        ) : null}
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectAvatar}
        />
      </div>

      {previewUrl ? (
        <div className="flex flex-col gap-2 sm:w-32">
          <button type="button" onClick={uploadAvatar} disabled={isUploading} className="button-blue px-3 py-2 text-xs">
            {isUploading ? "Saving..." : "Save Photo"}
          </button>
          <button type="button" onClick={resetSelection} disabled={isUploading} className="button-secondary px-3 py-2 text-xs">
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
