"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";

const emptyStoreForm = {
  storeName: "",
  supportEmail: "",
  phoneNumber: "",
  address: "",
  locationUrl: "",
  logoUrl: ""
};

const emptyPaymentForm = {
  khqrConfigured: false,
  merchantName: "",
  bakongId: "",
  accountName: "",
  currency: "",
  khqrImageUrl: ""
};

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readJson(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function StatusBadge({ configured }) {
  return (
    <span className={`badge-soft ${configured ? "badge-emerald" : "badge-rose"}`}>
      {configured ? "Configured" : "Missing"}
    </span>
  );
}

function SectionCard({ icon, title, description, children, footer }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
            <Icon name={icon} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {footer}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FormField({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function textInputClass(hasError = false) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    hasError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-brand-blue focus:ring-brand-blue/10"
  }`;
}

function SaveButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Saving..." : children}
    </button>
  );
}

export default function AdminSettingsClient() {
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings/status", { cache: "no-store" });
        const data = await readJson(response, "Unable to load settings.");

        if (!active) {
          return;
        }

        setStoreForm({ ...emptyStoreForm, ...(data?.store || {}) });
        setPaymentForm({ ...emptyPaymentForm, ...(data?.payment || {}) });
      } catch (loadError) {
        if (active) {
          toast.error(loadError instanceof Error ? loadError.message : "Unable to load settings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function setStoreValue(field, value) {
    setStoreForm((current) => ({ ...current, [field]: value }));
  }

  function setPaymentValue(field, value) {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  }

  async function saveSection(section, endpoint, payload, onSuccess) {
    try {
      setSavingSection(section);

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const data = await readJson(response, "Unable to save settings.");

      onSuccess(data);
      toast.success("Settings saved.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setSavingSection("");
    }
  }

  function saveStore(event) {
    event.preventDefault();

    if (!isValidEmail(storeForm.supportEmail)) {
      toast.error("Enter a valid support email address.");
      return;
    }

    saveSection("store", "/api/admin/settings/store", storeForm, (data) => setStoreForm({ ...emptyStoreForm, ...data }));
  }

  function savePayment(event) {
    event.preventDefault();

    saveSection("payment", "/api/admin/settings/payment", paymentForm, (data) => setPaymentForm({ ...emptyPaymentForm, ...data }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">Admin setup</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage public store details and payment display settings.</p>
        </div>
        {loading ? <span className="badge-soft badge-blue">Loading</span> : null}
      </div>

      <form onSubmit={saveStore}>
        <SectionCard
          icon="store"
          title="Store Information"
          description="Public-facing contact details used across store operations and customer support."
          footer={<SaveButton loading={savingSection === "store"}>Save Store</SaveButton>}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr,220px]">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Store name">
                <input
                  className={textInputClass()}
                  value={storeForm.storeName}
                  onChange={(event) => setStoreValue("storeName", event.target.value)}
                  placeholder="RobotIoKit"
                />
              </FormField>
              <FormField label="Support email">
                <input
                  className={textInputClass(storeForm.supportEmail && !isValidEmail(storeForm.supportEmail))}
                  value={storeForm.supportEmail}
                  onChange={(event) => setStoreValue("supportEmail", event.target.value)}
                  placeholder="support@example.com"
                />
              </FormField>
              <FormField label="Phone number">
                <input
                  className={textInputClass()}
                  value={storeForm.phoneNumber}
                  onChange={(event) => setStoreValue("phoneNumber", event.target.value)}
                  placeholder="+855 ..."
                />
              </FormField>
              <FormField label="Address">
                <input
                  className={textInputClass()}
                  value={storeForm.address}
                  onChange={(event) => setStoreValue("address", event.target.value)}
                  placeholder="Street, city, province"
                />
                {storeForm.locationUrl ? (
                  <a
                    href={storeForm.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-2 hover:decoration-brand-blue"
                  >
                    Open in Google Maps
                  </a>
                ) : null}
              </FormField>
            </div>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex aspect-square items-center justify-center rounded-lg bg-white text-slate-400">
                {storeForm.logoUrl ? (
                  <img src={storeForm.logoUrl} alt="Store logo preview" className="max-h-full max-w-full rounded-lg object-contain" />
                ) : (
                  <Icon name="store" className="h-10 w-10" />
                )}
              </div>
              <FormField label="Logo upload placeholder" hint="Upload wiring can reuse the media API in a later task.">
                <input
                  className={textInputClass()}
                  value={storeForm.logoUrl}
                  onChange={(event) => setStoreValue("logoUrl", event.target.value)}
                  placeholder="/uploads/logo.png"
                />
              </FormField>
            </div>
          </div>
        </SectionCard>
      </form>

      <form onSubmit={savePayment}>
        <SectionCard
          icon="creditCard"
          title="Payment Settings"
          description="KHQR display values for dynamic Bakong payment generation. Secret payment credentials stay in environment variables."
          footer={<StatusBadge configured={Boolean(paymentForm.khqrConfigured)} />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Merchant name">
              <input
                className={textInputClass()}
                value={paymentForm.merchantName}
                onChange={(event) => setPaymentValue("merchantName", event.target.value)}
                placeholder="RobotIoKit"
              />
            </FormField>
            <FormField label="Bakong ID">
              <input
                className={textInputClass()}
                value={paymentForm.bakongId}
                onChange={(event) => setPaymentValue("bakongId", event.target.value)}
                placeholder="merchant@bank"
              />
            </FormField>
            <FormField label="Account name">
              <input
                className={textInputClass()}
                value={paymentForm.accountName}
                onChange={(event) => setPaymentValue("accountName", event.target.value)}
                placeholder="RobotIoKit"
              />
            </FormField>
            <FormField label="Currency">
              <input
                className={textInputClass()}
                value={paymentForm.currency}
                onChange={(event) => setPaymentValue("currency", event.target.value.toUpperCase())}
                maxLength={3}
                placeholder="USD"
              />
            </FormField>
            <div className="md:col-span-2 flex justify-end">
              <SaveButton loading={savingSection === "payment"}>Save Payment</SaveButton>
            </div>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
