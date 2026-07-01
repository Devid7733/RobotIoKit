import prisma from "@/lib/prisma";

const ADMIN_NOTIFICATION_TYPES = ["ORDER_CREATED", "KHQR_PAYMENT_SUBMITTED"];

export async function findGlobalAdminNotificationRead(userId) {
  return prisma.adminNotificationRead.findFirst({
    where: {
      userId,
      notificationId: null
    },
    orderBy: { lastReadAt: "desc" }
  });
}

export async function findAdminNotificationReadIds(userId, notificationIds) {
  if (!notificationIds.length) {
    return [];
  }

  return prisma.adminNotificationRead.findMany({
    where: {
      userId,
      notificationId: {
        in: notificationIds
      }
    },
    select: {
      notificationId: true
    }
  });
}

export async function findAdminNotificationTimelineItems({ after, take = 100 } = {}) {
  return prisma.orderTimeline.findMany({
    where: {
      type: {
        in: ADMIN_NOTIFICATION_TYPES
      },
      ...(after
        ? {
            createdAt: {
              gt: after
            }
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          payment: {
            select: {
              status: true
            }
          }
        }
      }
    }
  });
}

export async function findAdminNotificationTimelineItemById(notificationId) {
  return prisma.orderTimeline.findFirst({
    where: {
      id: notificationId,
      type: {
        in: ADMIN_NOTIFICATION_TYPES
      }
    },
    select: { id: true }
  });
}

export async function countAdminNotificationTimelineItems({ after, excludeIds = [] } = {}) {
  return prisma.orderTimeline.count({
    where: {
      type: {
        in: ADMIN_NOTIFICATION_TYPES
      },
      ...(after
        ? {
            createdAt: {
              gt: after
            }
          }
        : {}),
      ...(excludeIds.length
        ? {
            id: {
              notIn: excludeIds
            }
          }
        : {})
    }
  });
}

export async function markAdminNotificationIdsRead(userId, notificationIds, readAt) {
  if (!notificationIds.length) {
    return { count: 0 };
  }

  return prisma.adminNotificationRead.createMany({
    data: notificationIds.map((notificationId) => ({
      userId,
      notificationId,
      lastReadAt: readAt
    })),
    skipDuplicates: true
  });
}

export async function upsertGlobalAdminNotificationRead(userId, lastReadAt) {
  const existing = await findGlobalAdminNotificationRead(userId);

  if (existing) {
    return prisma.adminNotificationRead.update({
      where: { id: existing.id },
      data: { lastReadAt }
    });
  }

  return prisma.adminNotificationRead.create({
    data: {
      userId,
      lastReadAt
    }
  });
}

export async function findAdminSettings() {
  return prisma.adminSettings.findUnique({
    where: { id: "default" }
  });
}

export async function upsertAdminSettings(data) {
  return prisma.adminSettings.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      ...data
    }
  });
}
