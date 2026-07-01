import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : []
  });

// Always cache — prevents connection exhaustion in serverless (Vercel)
globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;

export default prismaClient;
