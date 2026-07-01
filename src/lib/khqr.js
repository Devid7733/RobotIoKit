import QRCode from "qrcode";
import { BakongKHQR, IndividualInfo, MerchantInfo, khqrData } from "bakong-khqr";

export const STATIC_KHQR_IMAGE_PATH = "/payments/robotiokit-khqr.jpg";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for KHQR payments.`);
  }

  return value;
}

function optionalEnv(name) {
  return String(process.env[name] || "").trim() || null;
}

function createKhqrError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getCurrencyCode(currency) {
  return String(currency || "USD").toUpperCase() === "KHR" ? khqrData.currency.khr : khqrData.currency.usd;
}

function getPaymentWindowMinutes() {
  const minutes = Number(process.env.KHQR_PAYMENT_EXPIRY_MINUTES || 5);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
}

export function getKhqrMerchantConfig() {
  return {
    merchantName: requireEnv("KHQR_MERCHANT_NAME"),
    accountId: requireEnv("KHQR_ACCOUNT_ID"),
    bankName: requireEnv("KHQR_BANK_NAME"),
    city: requireEnv("KHQR_CITY"),
    currency: requireEnv("KHQR_CURRENCY").toUpperCase(),
    merchantId: optionalEnv("KHQR_MERCHANT_ID") || optionalEnv("BAKONG_MERCHANT_ID"),
    acquiringBank: optionalEnv("KHQR_ACQUIRING_BANK"),
    merchantCategoryCode: optionalEnv("KHQR_MERCHANT_CATEGORY_CODE") || "5999",
    storeLabel: optionalEnv("KHQR_STORE_LABEL") || requireEnv("KHQR_MERCHANT_NAME"),
    terminalLabel: optionalEnv("KHQR_TERMINAL_LABEL") || "WEB",
    qrImagePath: STATIC_KHQR_IMAGE_PATH
  };
}

export function validateDynamicKhqrConfig() {
  const merchant = getKhqrMerchantConfig();

  if (!merchant.accountId.includes("@")) {
    throw createKhqrError(
      "KHQR_ACCOUNT_ID must be a Bakong account ID like merchant@bank. Phone/account numbers cannot generate Bakong KHQR with the Bakong SDK."
    );
  }

  return merchant;
}

export function getKhqrPaymentExpiresAt() {
  return new Date(Date.now() + getPaymentWindowMinutes() * 60 * 1000);
}

export async function generateDynamicKhqrPayment({ amount, orderNumber, expiresAt }) {
  const merchant = validateDynamicKhqrConfig();
  const total = Number(amount || 0);

  if (!Number.isFinite(total) || total <= 0) {
    throw createKhqrError("A positive order total is required for KHQR generation.", 400);
  }

  const optionalData = {
    currency: getCurrencyCode(merchant.currency),
    amount: merchant.currency === "KHR" ? Math.round(total) : Number(total.toFixed(2)),
    billNumber: String(orderNumber || "").slice(0, 25),
    storeLabel: String(merchant.storeLabel || "").slice(0, 25),
    terminalLabel: String(merchant.terminalLabel || "").slice(0, 25),
    expirationTimestamp: expiresAt ? new Date(expiresAt).getTime() : getKhqrPaymentExpiresAt().getTime(),
    merchantCategoryCode: merchant.merchantCategoryCode
  };

  const khqr = new BakongKHQR();
  const info =
    merchant.merchantId && merchant.acquiringBank
      ? new MerchantInfo(
          merchant.accountId,
          merchant.merchantName,
          merchant.city,
          merchant.merchantId,
          merchant.acquiringBank,
          optionalData
        )
      : new IndividualInfo(merchant.accountId, merchant.merchantName, merchant.city, optionalData);
  const response = merchant.merchantId && merchant.acquiringBank ? khqr.generateMerchant(info) : khqr.generateIndividual(info);

  if (response?.error || (response?.status && response.status.code !== 0)) {
    throw createKhqrError(response?.error?.message || response?.status?.message || "Unable to generate dynamic KHQR.");
  }

  const qrPayload = response?.data?.qr;
  const md5 = response?.data?.md5;

  if (!qrPayload || !md5) {
    throw createKhqrError("Unable to generate dynamic KHQR payload.");
  }

  return {
    qrPayload,
    md5,
    qrImageDataUrl: await renderKhqrPayloadImage(qrPayload)
  };
}

export async function renderKhqrPayloadImage(qrPayload) {
  return QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320
  });
}
