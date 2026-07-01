import { getDeliveryFee } from "@/lib/deliveryFee";
import { findAdminSettings } from "@/modules/admin/admin.repository";

function cleanText(value) {
  return String(value || "").trim();
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function getStoreLocationLink(address = "") {
  const cleanAddress = cleanText(address);
  return cleanAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}` : "";
}

export async function getPublicStoreSupportSettings() {
  const settings = await findAdminSettings();
  const address = cleanText(settings?.address);

  return {
    storeName: cleanText(settings?.storeName) || "RobotIoKit",
    address,
    locationUrl: getStoreLocationLink(address),
    phoneNumber: cleanText(settings?.phoneNumber),
    supportEmail: cleanText(settings?.supportEmail || process.env.EMAIL_FROM),
    deliveryFees: {
      phnomPenh: getDeliveryFee("Phnom Penh"),
      otherProvince: getDeliveryFee("Kandal")
    }
  };
}

export function formatDeliveryFeeText(settings) {
  const phnomPenhFee = formatMoney(settings?.deliveryFees?.phnomPenh);
  const otherProvinceFee = formatMoney(settings?.deliveryFees?.otherProvince);

  return `Delivery fee is ${phnomPenhFee} in Phnom Penh and ${otherProvinceFee} for other provinces.`;
}
