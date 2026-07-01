DROP INDEX IF EXISTS "AdminNotificationRead_userId_notificationId_read_key";
DROP INDEX IF EXISTS "AdminNotificationRead_userId_global_read_key";

CREATE UNIQUE INDEX IF NOT EXISTS "AdminNotificationRead_userId_notificationId_key"
  ON "AdminNotificationRead"("userId", "notificationId");
