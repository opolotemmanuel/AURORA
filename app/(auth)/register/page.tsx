// There's no separate sign-up flow — email OTP sign-in creates the user on
// first successful verification (see lib/auth/auth.ts). This route exists
// only to redirect anyone who lands on /register (e.g. an old link or a
// guessed URL) to the real entry point.
import { redirect } from "next/navigation"

export default function RegisterPage() {
  redirect("/login")
}
