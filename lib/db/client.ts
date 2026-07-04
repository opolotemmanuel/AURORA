import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

function normalizeConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString)
    // channel_binding=require can cause timeouts with node-pg + Neon pooler.
    url.searchParams.delete("channel_binding")
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require")
    }
    return url.toString()
  } catch {
    return connectionString
  }
}

function createPgPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  return new Pool({
    connectionString: normalizeConnectionString(connectionString),
    max: 10,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 60_000,
    keepAlive: true,
  })
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPgPool()
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
