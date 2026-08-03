const cookie = process.argv[2]
const res = await fetch("http://localhost:3000/scan", {
  headers: { cookie },
  redirect: "manual",
})
console.log("STATUS", res.status)
console.log("LOCATION", res.headers.get("location"))
const text = await res.text()
console.log("LENGTH", text.length)
import { writeFileSync } from "node:fs"
writeFileSync("_scratch-scan-page.html", text)
