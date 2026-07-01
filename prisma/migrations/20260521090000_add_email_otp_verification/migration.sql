ALTER TABLE "User"
ADD COLUMN "emailVerificationOtpHash" TEXT,
ADD COLUMN "emailVerificationOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationSentAt" TIMESTAMP(3);

UPDATE "User"
SET "emailVerified" = COALESCE("emailVerified", NOW())
WHERE "emailVerified" IS NULL;
