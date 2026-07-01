ALTER TABLE "AdminNotificationRead" ADD COLUMN IF NOT EXISTS "notificationId" TEXT;

DROP INDEX IF EXISTS "AdminNotificationRead_userId_key";

CREATE INDEX IF NOT EXISTS "AdminNotificationRead_userId_notificationId_idx"
  ON "AdminNotificationRead"("userId", "notificationId");

CREATE UNIQUE INDEX IF NOT EXISTS "AdminNotificationRead_userId_notificationId_read_key"
  ON "AdminNotificationRead"("userId", "notificationId")
  WHERE "notificationId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminNotificationRead_userId_global_read_key"
  ON "AdminNotificationRead"("userId")
  WHERE "notificationId" IS NULL;
