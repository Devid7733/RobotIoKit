import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  // Reject anything that is not exactly "salt:hash" — plaintext, truncated, or
  // otherwise malformed values must never fall through to a comparison.
  const parts = storedPassword.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.warn("Invalid password format detected");
    return false;
  }

  const [salt, storedHash] = parts;
  const hashBuffer = scryptSync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (hashBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, storedBuffer);
}
