import pg from "pg"
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
const r = await client.query(`SELECT id, email, "scanConsentGivenAt" FROM "User" WHERE id IN ('gO3izYviQ24N7uLZNKu6jdqX1BbnnCDJ','8ZbWkuaYtuJiKmM1NBB4D54AX5RRW4y5')`)
console.log(JSON.stringify(r.rows, null, 2))
await client.end()
