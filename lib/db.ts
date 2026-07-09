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

  // This app's working setup is a remote Prisma Postgres — a localhost
  // DATABASE_URL has repeatedly shown up here half-configured (wrong
  // credentials, database not created) and silently broken sign-up/login.
  // Not thrown: a real local Postgres setup is a legitimate choice, just
  // not this project's current one — this is a nudge, not a hard block.
  if (process.env.NODE_ENV !== "production" && databaseUrl.includes("localhost")) {
    console.warn(
      "[lib/db] DATABASE_URL points at localhost — if this isn't a deliberately configured local Postgres, check .env.local for a stray second DATABASE_URL line.",
    )
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
