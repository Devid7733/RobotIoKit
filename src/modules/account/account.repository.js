import prisma from "@/lib/prisma";

export function findUserProfileById(userId) {
  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export function updateUserProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

export function updateUserAvatar(userId, avatarUrl) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl }
  });
}
