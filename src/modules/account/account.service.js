import { findUserProfileById, updateUserAvatar, updateUserProfile } from "@/modules/account/account.repository";

export const ACCOUNT_PROVINCES = [
  "Phnom Penh",
  "Kandal",
  "Siem Reap",
  "Battambang",
  "Kampong Cham",
  "Kampot",
  "Preah Sihanouk"
];

function createServiceError(message, status = 400, fields = {}) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value) {
  const text = cleanText(value);
  return text || null;
}

export function formatAccountProfile(user) {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email,
    phone: user.phone || "",
    province: user.province || "",
    city: user.city || "",
    address: user.address || "",
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    image: user.image || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function getAccountProfile(userId) {
  const user = await findUserProfileById(userId);
  return user ? formatAccountProfile(user) : null;
}

export function validateAccountProfileInput(body = {}) {
  const fields = {};
  const name = cleanText(body.name);
  const phone = cleanText(body.phone);
  const province = cleanText(body.province);
  const city = cleanText(body.city);
  const address = cleanText(body.address);

  if (name && name.length < 2) {
    fields.name = "Full name must be at least 2 characters.";
  }

  if (name.length > 80) {
    fields.name = "Full name must be 80 characters or fewer.";
  }

  if (phone && !/^[+0-9\s().-]{6,30}$/.test(phone)) {
    fields.phone = "Enter a valid phone number.";
  }

  if (province && !ACCOUNT_PROVINCES.includes(province)) {
    fields.province = "Choose a supported province.";
  }

  if (city.length > 80) {
    fields.city = "City or district must be 80 characters or fewer.";
  }

  if (address.length > 180) {
    fields.address = "Address must be 180 characters or fewer.";
  }

  if (Object.keys(fields).length > 0) {
    throw createServiceError("Please check the highlighted profile fields.", 400, fields);
  }

  return {
    name: nullableText(body.name),
    phone: nullableText(body.phone),
    province: nullableText(body.province),
    city: nullableText(body.city),
    address: nullableText(body.address)
  };
}

export async function updateAccountProfile(userId, body) {
  const data = validateAccountProfileInput(body);
  const user = await updateUserProfile(userId, data);
  return formatAccountProfile(user);
}

export async function updateAccountAvatar(userId, avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== "string") {
    throw createServiceError("Avatar URL is required.", 400);
  }

  const user = await updateUserAvatar(userId, avatarUrl);
  return formatAccountProfile(user);
}
