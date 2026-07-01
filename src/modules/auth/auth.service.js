import { createHash, randomInt } from "crypto";
import { hashPassword } from "@/lib/password";
import { sendMail } from "@/lib/mail";
import {
  createPasswordResetToken,
  createUser,
  findUserByEmail,
  findLatestPasswordResetToken,
  incrementPasswordResetTokenAttempts,
  markUserEmailVerified,
  markPasswordResetTokenUsed,
  updateUserPassword,
  updateUserEmailOtp
} from "@/modules/auth/auth.repository";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const RESET_ATTEMPT_LIMIT = 5;
const FORGOT_PASSWORD_MESSAGE = "If an account exists, we sent a password reset code.";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(otp) {
  return createHash("sha256").update(otp).digest("hex");
}

function createOtp() {
  return String(randomInt(100000, 1000000));
}

function getOtpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

function buildOtpEmail({ name, otp }) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return {
    subject: "Verify your RobotIoKit email",
    text: `${greeting}\n\nYour RobotIoKit verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <p>${greeting}</p>
        <p>Use this code to verify your RobotIoKit account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2251f5; margin: 24px 0;">${otp}</p>
        <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        <p style="color: #64748b;">If you did not create this account, you can ignore this email.</p>
      </div>
    `
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
}

function validatePassword(password) {
  const pw = String(password || "");
  if (pw.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(pw)) {
    throw new Error("Password must contain at least one uppercase letter.");
  }
  if (!/[0-9]/.test(pw)) {
    throw new Error("Password must contain at least one number.");
  }
}

function buildPasswordResetEmail({ name, otp }) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return {
    subject: "Reset your RobotIOKits password",
    text: `${greeting}\n\nYour RobotIOKits password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <p>${greeting}</p>
        <p>Use this code to reset your RobotIOKits password:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2251f5; margin: 24px 0;">${otp}</p>
        <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        <p style="color: #64748b;">If you did not request a password reset, you can ignore this email.</p>
      </div>
    `
  };
}

async function sendUserOtp(user) {
  const otp = createOtp();
  const expiresAt = getOtpExpiry();

  await updateUserEmailOtp(user.id, {
    emailVerificationOtpHash: hashOtp(otp),
    emailVerificationOtpExpiresAt: expiresAt,
    emailVerificationSentAt: new Date()
  });

  const message = buildOtpEmail({ name: user.name, otp });
  await sendMail({
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  return expiresAt;
}

export async function registerUser(input) {
  const email = normalizeEmail(input.email);
  const fullName = String(input.fullName || "").trim();

  if (!email || !input.password || !fullName) {
    throw new Error("Full name, email, and password are required.");
  }

  validateEmail(email);
  validatePassword(input.password);

  if (fullName.length < 2) {
    throw new Error("Full name must be at least 2 characters.");
  }

  if (fullName.length > 100) {
    throw new Error("Full name must not exceed 100 characters.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user = await createUser({
    name: fullName,
    email,
    emailVerified: null,
    password: hashPassword(input.password),
    phone: null,
    province: null,
    city: null,
    address: null
  });

  let expiresAt = null;
  let emailSent = true;

  try {
    expiresAt = await sendUserOtp(user);
  } catch (error) {
    emailSent = false;
    console.error("Unable to send verification email", error);
  }

  return {
    user,
    expiresAt,
    emailSent
  };
}

export async function requestPasswordReset(input) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("Email is required.");
  }

  const user = await findUserByEmail(email);

  if (!user || !user.password) {
    return {
      message: FORGOT_PASSWORD_MESSAGE
    };
  }

  const latestToken = await findLatestPasswordResetToken(email);

  if (
    latestToken &&
    !latestToken.usedAt &&
    Date.now() - latestToken.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return {
      message: FORGOT_PASSWORD_MESSAGE
    };
  }

  const otp = createOtp();
  const expiresAt = getOtpExpiry();

  await createPasswordResetToken({
    email,
    otpHash: hashOtp(otp),
    expiresAt
  });

  const message = buildPasswordResetEmail({ name: user.name, otp });
  await sendMail({
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  return {
    message: FORGOT_PASSWORD_MESSAGE
  };
}

export async function resetPassword(input) {
  const email = normalizeEmail(input.email);
  const otp = String(input.otp || "").trim();
  const newPassword = String(input.newPassword || "");

  if (!email || !otp || !newPassword) {
    throw new Error("Email, verification code, and new password are required.");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Enter the 6-digit reset code.");
  }

  validatePassword(newPassword);

  const user = await findUserByEmail(email);
  const token = await findLatestPasswordResetToken(email);

  if (!user || !user.password || !token) {
    throw new Error("Invalid or expired reset code.");
  }

  if (token.usedAt) {
    throw new Error("This reset code has already been used.");
  }

  if (token.expiresAt.getTime() < Date.now()) {
    throw new Error("Reset code expired. Please request a new code.");
  }

  if (token.attempts >= RESET_ATTEMPT_LIMIT) {
    throw new Error("Too many invalid attempts. Please request a new code.");
  }

  if (hashOtp(otp) !== token.otpHash) {
    await incrementPasswordResetTokenAttempts(token.id);
    throw new Error("Invalid reset code.");
  }

  await updateUserPassword(user.id, hashPassword(newPassword));
  await markPasswordResetTokenUsed(token.id);

  return {
    message: "Password reset successfully."
  };
}

export async function verifyEmailOtp(input) {
  const email = normalizeEmail(input.email);
  const otp = String(input.otp || "").trim();

  if (!email || !otp) {
    throw new Error("Email and verification code are required.");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Enter the 6-digit verification code.");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("No account was found for this email.");
  }

  if (user.emailVerified) {
    return {
      alreadyVerified: true,
      user
    };
  }

  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    throw new Error("No active verification code found. Please request a new code.");
  }

  if (user.emailVerificationOtpExpiresAt.getTime() < Date.now()) {
    throw new Error("Verification code expired. Please request a new code.");
  }

  if (hashOtp(otp) !== user.emailVerificationOtpHash) {
    throw new Error("Invalid verification code.");
  }

  const verifiedUser = await markUserEmailVerified(user.id);

  return {
    alreadyVerified: false,
    user: verifiedUser
  };
}

export async function resendEmailOtp(input) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("Email is required.");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("No account was found for this email.");
  }

  if (user.emailVerified) {
    return {
      alreadyVerified: true,
      expiresAt: null
    };
  }

  if (
    user.emailVerificationSentAt &&
    Date.now() - user.emailVerificationSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    throw new Error("Please wait a minute before requesting another code.");
  }

  const expiresAt = await sendUserOtp(user);

  return {
    alreadyVerified: false,
    expiresAt
  };
}
