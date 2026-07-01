import {
  countAdminNotificationTimelineItems,
  findAdminNotificationReadIds,
  findAdminNotificationTimelineItemById,
  findAdminNotificationTimelineItems,
  findAdminSettings,
  findGlobalAdminNotificationRead,
  markAdminNotificationIdsRead,
  upsertAdminSettings,
  upsertGlobalAdminNotificationRead
} from "@/modules/admin/admin.repository";
import { STATIC_KHQR_IMAGE_PATH } from "@/lib/khqr";
import { getStoreLocationLink } from "@/services/storeSupportService";

const SETTINGS_GROUPS = [
  {
    id: "auth",
    label: "Auth secret",
    requiredKeys: ["NEXTAUTH_SECRET"]
  },
  {
    id: "smtp",
    label: "SMTP",
    requiredKeys: ["EMAIL_SERVER_USER", "EMAIL_SERVER_PASSWORD", "EMAIL_FROM"]
  },
  {
    id: "khqrEnv",
    label: "KHQR env",
    requiredKeys: [
      "KHQR_MERCHANT_NAME",
      "KHQR_ACCOUNT_ID",
      "KHQR_BANK_NAME",
      "KHQR_CITY",
      "KHQR_CURRENCY",
      "BAKONG_API_TOKEN"
    ]
  }
];

function isMissingEnvValue(key) {
  return !String(process.env[key] || "").trim();
}

function createServiceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getEnvValue(key) {
  return String(process.env[key] || "").trim() || null;
}

function formatStoreSettings(settings) {
  const address = settings?.address || "";

  return {
    storeName: settings?.storeName || "RobotIoKit",
    supportEmail: settings?.supportEmail || getEnvValue("EMAIL_FROM") || "",
    phoneNumber: settings?.phoneNumber || "",
    address,
    locationUrl: getStoreLocationLink(address),
    logoUrl: settings?.logoUrl || ""
  };
}

function formatEmailSettings(settings) {
  return {
    smtpConfigured: !isMissingEnvValue("EMAIL_SERVER_USER") && !isMissingEnvValue("EMAIL_SERVER_PASSWORD") && !isMissingEnvValue("EMAIL_FROM"),
    smtpHost: settings?.smtpHost || "smtp.gmail.com",
    smtpPort: settings?.smtpPort || 587,
    senderEmail: settings?.senderEmail || getEnvValue("EMAIL_FROM") || ""
  };
}

function formatPaymentSettings(settings) {
  return {
    khqrConfigured:
      !isMissingEnvValue("KHQR_MERCHANT_NAME") &&
      !isMissingEnvValue("KHQR_ACCOUNT_ID") &&
      !isMissingEnvValue("KHQR_BANK_NAME") &&
      !isMissingEnvValue("KHQR_CITY") &&
      !isMissingEnvValue("KHQR_CURRENCY") &&
      !isMissingEnvValue("BAKONG_API_TOKEN"),
    merchantName: settings?.merchantName || getEnvValue("KHQR_MERCHANT_NAME") || "",
    bakongId: settings?.bakongId || getEnvValue("KHQR_ACCOUNT_ID") || "",
    accountName: settings?.accountName || getEnvValue("KHQR_MERCHANT_NAME") || "",
    currency: settings?.currency || getEnvValue("KHQR_CURRENCY") || "USD",
    khqrImageUrl: settings?.khqrImageUrl || STATIC_KHQR_IMAGE_PATH
  };
}

function getNotificationTitle(notification) {
  if (notification.type === "ORDER_CREATED") {
    return `New order ${notification.order?.orderNumber || ""}`.trim();
  }

  if (notification.type === "KHQR_PAYMENT_SUBMITTED") {
    return `Payment proof submitted ${notification.order?.orderNumber || ""}`.trim();
  }

  return "Admin notification";
}

function formatNotificationType(type) {
  return String(type || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAdminNotification(notification, readIds, globalReadAt) {
  const isReadByGlobalMarker = globalReadAt ? notification.createdAt <= globalReadAt : false;
  const isReadByItemMarker = readIds.has(notification.id);
  const paymentStatus = notification.order?.payment?.status || null;

  return {
    id: notification.id,
    title: getNotificationTitle(notification),
    message: notification.message,
    body: notification.message,
    type: notification.type,
    typeLabel: formatNotificationType(notification.type),
    status: paymentStatus || notification.order?.status || null,
    orderId: notification.order?.id || null,
    orderNumber: notification.order?.orderNumber || null,
    createdAt: notification.createdAt.toISOString(),
    read: isReadByGlobalMarker || isReadByItemMarker
  };
}

export async function getUnreadAdminNotificationCount(userId) {
  const globalMarker = await findGlobalAdminNotificationRead(userId);
  const after = globalMarker?.lastReadAt || null;
  const recentNotifications = await findAdminNotificationTimelineItems({ after, take: 500 });
  const readMarkers = await findAdminNotificationReadIds(
    userId,
    recentNotifications.map((notification) => notification.id)
  );
  const readIds = readMarkers.map((marker) => marker.notificationId).filter(Boolean);

  return countAdminNotificationTimelineItems({ after, excludeIds: readIds });
}

export async function getAdminNotifications(userId) {
  const [globalMarker, notifications] = await Promise.all([
    findGlobalAdminNotificationRead(userId),
    findAdminNotificationTimelineItems({ take: 100 })
  ]);
  const readMarkers = await findAdminNotificationReadIds(
    userId,
    notifications.map((notification) => notification.id)
  );
  const readIds = new Set(readMarkers.map((marker) => marker.notificationId).filter(Boolean));
  const globalReadAt = globalMarker?.lastReadAt || null;

  return {
    notifications: notifications.map((notification) => formatAdminNotification(notification, readIds, globalReadAt))
  };
}

export async function markAdminNotificationsRead(userId, body = {}) {
  const notificationId = cleanText(body.notificationId);
  const markAll = body.all === true || !notificationId;
  const readAt = new Date();

  if (markAll) {
    await upsertGlobalAdminNotificationRead(userId, readAt);
    return { unreadCount: 0 };
  }

  const notification = await findAdminNotificationTimelineItemById(notificationId);

  if (!notification) {
    throw createServiceError("Notification not found.", 404);
  }

  await markAdminNotificationIdsRead(userId, [notificationId], readAt);
  const unreadCount = await getUnreadAdminNotificationCount(userId);

  return { unreadCount };
}

export async function getAdminSettingsStatus() {
  const settings = await findAdminSettings();

  const groups = SETTINGS_GROUPS.map((group) => {
    const missingKeys = group.requiredKeys.filter(isMissingEnvValue);

    return {
      id: group.id,
      label: group.label,
      configured: missingKeys.length === 0
    };
  });

  const missing = groups
    .filter((group) => !group.configured)
    .map((group) => ({
      key: group.id,
      label: group.label
    }));

  return {
    complete: missing.length === 0,
    attentionCount: missing.length,
    missing,
    groups,
    store: formatStoreSettings(settings),
    email: formatEmailSettings(settings),
    payment: formatPaymentSettings(settings)
  };
}

export async function getAdminStoreSettings() {
  const settings = await findAdminSettings();
  return formatStoreSettings(settings);
}

export async function updateAdminStoreSettings(body) {
  const supportEmail = cleanText(body.supportEmail);

  if (!isValidEmail(supportEmail)) {
    throw createServiceError("Enter a valid support email address.", 400);
  }

  const settings = await upsertAdminSettings({
    storeName: cleanText(body.storeName),
    supportEmail,
    phoneNumber: cleanText(body.phoneNumber),
    address: cleanText(body.address),
    logoUrl: cleanText(body.logoUrl)
  });

  return formatStoreSettings(settings);
}

export async function getAdminEmailSettings() {
  const settings = await findAdminSettings();
  return formatEmailSettings(settings);
}

export async function updateAdminEmailSettings(body) {
  const senderEmail = cleanText(body.senderEmail);
  const portValue = body.smtpPort === "" || body.smtpPort === null || body.smtpPort === undefined ? null : Number(body.smtpPort);

  if (!isValidEmail(senderEmail)) {
    throw createServiceError("Enter a valid sender email address.", 400);
  }

  if (portValue !== null && (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535)) {
    throw createServiceError("SMTP port must be a number between 1 and 65535.", 400);
  }

  const settings = await upsertAdminSettings({
    smtpHost: cleanText(body.smtpHost),
    smtpPort: portValue,
    senderEmail
  });

  return formatEmailSettings(settings);
}

export async function getAdminPaymentSettings() {
  const settings = await findAdminSettings();
  return formatPaymentSettings(settings);
}

export async function updateAdminPaymentSettings(body) {
  const currency = cleanText(body.currency);

  if (currency && !/^[A-Za-z]{3}$/.test(currency)) {
    throw createServiceError("Currency must use a 3-letter code.", 400);
  }

  const settings = await upsertAdminSettings({
    merchantName: cleanText(body.merchantName),
    bakongId: cleanText(body.bakongId),
    accountName: cleanText(body.accountName),
    currency: currency ? currency.toUpperCase() : null,
    khqrImageUrl: cleanText(body.khqrImageUrl)
  });
  return formatPaymentSettings(settings);
}
