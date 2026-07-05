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

    const sslmode = url.searchParams.get("sslmode")
    // pg v8 treats require/prefer/verify-ca as verify-full; set explicitly to
    // avoid the deprecation warning and keep strict SSL with Neon.
    if (
      !sslmode ||
      sslmode === "require" ||
      sslmode === "prefer" ||
      sslmode === "verify-ca"
    ) {
      url.searchParams.set("sslmode", "verify-full")
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

  // Use Neon's pooled host (*-pooler.*.neon.tech) in DATABASE_URL for serverless.
  const pool = new Pool({
    connectionString: normalizeConnectionString(connectionString),
    max: 10,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 60_000,
    keepAlive: true,
  })

  pool.on("error", (error) => {
    console.error("[db] idle pool client error:", error)
  })

  return pool
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
