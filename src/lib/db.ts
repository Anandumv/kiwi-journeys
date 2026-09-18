import { PrismaClient } from "@prisma/client";

// Reuse the Prisma client across hot reloads in dev to avoid connection storms.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// This app runs as one long-lived Node process (`next start` on Railway), not
// as per-request serverless functions. A pool of 1 would serialize the entire
// site through a single connection: one checkout holding its transaction open
// across a Stripe round-trip would stall every other request, /api/health
// included, until the health check failed and the instance restarted.
//
// 10 is comfortable for a Railway hobby Postgres (default max_connections 100)
// while leaving headroom for migrations and manual psql sessions. Operators who
// put a pooler in front can override it in DATABASE_URL.
const DEFAULT_CONNECTION_LIMIT = "10";

function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.NODE_ENV !== "production") return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", process.env.DATABASE_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: { db: { url: buildDatabaseUrl() } },
    });
  } catch {
    // DATABASE_URL not available at build time — return a stub that throws on use.
    // Callers (content.ts, etc.) all have try/catch and fall back to static data.
    return new PrismaClient({ log: [] });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
