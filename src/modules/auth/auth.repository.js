import prisma from "@/lib/prisma";

export function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export function findUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export function createUser(data) {
  return prisma.user.create({ data });
}

export function updateUserEmailOtp(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

export function markUserEmailVerified(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
      emailVerificationOtpHash: null,
      emailVerificationOtpExpiresAt: null,
      emailVerificationSentAt: null
    }
  });
}

export function updateUserPassword(userId, password) {
  return prisma.user.update({
    where: { id: userId },
    data: { password }
  });
}

export function createPasswordResetToken(data) {
  return prisma.passwordResetToken.create({ data });
}

export function findLatestPasswordResetToken(email) {
  return prisma.passwordResetToken.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" }
  });
}

export function incrementPasswordResetTokenAttempts(tokenId) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      attempts: {
        increment: 1
      }
    }
  });
}

export function markPasswordResetTokenUsed(tokenId) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      usedAt: new Date()
    }
  });
}
