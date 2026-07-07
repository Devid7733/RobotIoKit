"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CAMBODIA_PROVINCES } from "@/lib/provinces";

export default function AccountProfileForm({ user }) {
  function getInitialForm(profile) {
    return {
      name: profile.name || "",
      phone: profile.phone || "",
      province: profile.province || "Phnom Penh",
      address: profile.address || ""
    };
  }

  const [form, setForm] = useState(getInitialForm(user));
  const [savedForm, setSavedForm] = useState(getInitialForm(user));
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const isProfileIncomplete = !savedForm.name || !savedForm.phone || !savedForm.address;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
  }

  function cancelEditing() {
    setForm(savedForm);
    setFieldErrors({});
    setIsEditing(false);
  }

  function validateProfile() {
    const errors = {};

    if (form.name.trim() && form.name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }

    if (form.phone.trim() && !/^[+0-9\s().-]{6,30}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number.";
    }

    if (form.address.trim().length > 180) {
      errors.address = "Address must be 180 characters or fewer.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitProfile(event) {
    event.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!validateProfile()) return;

    setIsSaving(true);
    setFieldErrors({});

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (result.fields) {
          setFieldErrors(result.fields);
        }
        throw new Error(result.message || "Unable to update profile.");
      }

      const nextForm = {
        name: result.data.name || "",
        phone: result.data.phone || "",
        province: result.data.province || "Phnom Penh",
        address: result.data.address || ""
      };
      setForm(nextForm);
      setSavedForm(nextForm);
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  const fieldClass = (name) =>
    `input-base disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700 disabled:opacity-100 ${
      fieldErrors[name] ? "border-red-400 bg-red-50/40" : ""
    }`;

  return (
    <div className="section-card">
      <div>
        <h2 className="heading-card">Profile Details</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
          Keep your contact and delivery details ready for faster checkout.
        </p>
      </div>

      {isProfileIncomplete ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Add your name, phone, and delivery address so checkout can prefill them.
        </div>
      ) : null}

      <form onSubmit={submitProfile} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="account-name">
              Full Name
            </label>
            <input
              id="account-name"
              className={fieldClass("name")}
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Add your full name"
              type="text"
              disabled={!isEditing || isSaving}
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="account-phone">
              Phone Number
            </label>
            <input
              id="account-phone"
              className={fieldClass("phone")}
              name="phone"
              value={form.phone}
              onChange={updateField}
              placeholder="+855 12 000 000"
              type="tel"
              disabled={!isEditing || isSaving}
            />
            {fieldErrors.phone ? <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p> : null}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="account-province">
            Province
          </label>
          <select
            id="account-province"
            className={fieldClass("province")}
            name="province"
            value={form.province}
            onChange={updateField}
            disabled={!isEditing || isSaving}
          >
            {CAMBODIA_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          {fieldErrors.province ? <p className="mt-1 text-xs text-red-500">{fieldErrors.province}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="account-address">
            Delivery Address
          </label>
          <textarea
            id="account-address"
            className={`${fieldClass("address")} min-h-28 resize-none`}
            name="address"
            value={form.address}
            onChange={updateField}
            placeholder="Street, house number, landmarks"
            disabled={!isEditing || isSaving}
          />
          {fieldErrors.address ? <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={isSaving} className="button-blue w-full sm:w-auto">
            {isSaving ? "Saving..." : isEditing ? "Save Profile" : "Edit Profile"}
          </button>
          {isEditing ? (
            <button type="button" disabled={isSaving} onClick={cancelEditing} className="button-secondary w-full sm:w-auto">
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
