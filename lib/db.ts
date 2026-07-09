// Single shared Prisma client for the whole app. Every module that needs
// the database imports `prisma` from here instead of constructing its own
// client (see AGENTS.md: "Prisma Client from a single module").
import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

// Next.js dev mode reloads modules on every file change, which would create
// a new PrismaClient (and a new DB connection pool) per reload. Stashing the
// client on `globalThis` lets it survive hot reloads in development.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Configure PostgreSQL before using Prisma persistence.")
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Only cache on globalThis outside production — in production each process
// should own exactly one client for its whole lifetime anyway, so there's
// nothing to reuse across reloads.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
