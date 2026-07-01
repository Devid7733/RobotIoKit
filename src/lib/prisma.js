import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const RETRYABLE_ERROR_CODES = new Set(["P1001", "P1017"]);
const RETRYABLE_MESSAGE_PATTERN = /can't reach database server|server has closed the connection/i;

function isRetryableConnectionError(error) {
  const code = error?.errorCode || error?.code;
  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return true;
  }
  return RETRYABLE_MESSAGE_PATTERN.test(error?.message || "");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : []
  });

  // Neon's free-tier compute auto-suspends when idle; the first query after a
  // cold start can hit "Can't reach database server" for a moment while it
  // wakes up. Retry those specific connection errors instead of failing the request.
  return client.$extends({
    name: "retry-on-cold-start",
    query: {
      async $allOperations({ args, query }) {
        const retryDelaysMs = [300, 600];
        let attempt = 0;

        while (true) {
          try {
            return await query(args);
          } catch (error) {
            if (attempt >= retryDelaysMs.length || !isRetryableConnectionError(error)) {
              throw error;
            }
            await wait(retryDelaysMs[attempt]);
            attempt += 1;
          }
        }
      }
    }
  });
}

const prismaClient = globalForPrisma.prisma || createPrismaClient();

// Always cache — prevents connection exhaustion in serverless (Vercel)
globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;

export default prismaClient;
