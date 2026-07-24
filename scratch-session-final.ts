import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./lib/generated/prisma/client"
import { makeSignature } from "better-auth/crypto"
import crypto from "node:crypto"

const databaseUrl = process.env.DATABASE_URL as string
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

const userId = "gO3izYviQ24N7uLZNKu6jdqX1BbnnCDJ"
const token = crypto.randomBytes(32).toString("hex")
const secret = process.env.BETTER_AUTH_SECRET as string
const signed = `${token}.${await makeSignature(token, secret)}`

await prisma.authSession.create({
  data: {
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    ipAddress: "127.0.0.1",
    userAgent: "visual-verification",
  },
})
console.log("COOKIE_VALUE=" + signed)
await prisma.$disconnect()
