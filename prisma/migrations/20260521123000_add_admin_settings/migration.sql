-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT,
    "supportEmail" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "senderEmail" TEXT,
    "merchantName" TEXT,
    "bakongId" TEXT,
    "accountName" TEXT,
    "currency" TEXT,
    "khqrImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);
