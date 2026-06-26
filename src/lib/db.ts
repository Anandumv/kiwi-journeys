import { PrismaClient } from "@prisma/client";

// Reuse the Prisma client across hot reloads in dev to avoid connection storms.
// In production (serverless), each cold-start creates one connection. Cap it via
// connection_limit=1 in the URL so we never exhaust Postgres max_connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.NODE_ENV !== "production") return url;
  // Append connection_limit=1 if not already set by the operator.
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", "1");
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
