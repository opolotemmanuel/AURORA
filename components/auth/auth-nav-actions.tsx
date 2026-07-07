"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { IconArrowRight } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

const placeholderSessionKey = "aurora-placeholder-session"

export function AuthNavActions() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    function syncSession() {
      setIsLoggedIn(Boolean(window.localStorage.getItem(placeholderSessionKey)))
    }

    syncSession()
    window.addEventListener("storage", syncSession)
    window.addEventListener("aurora-auth-change", syncSession)

    return () => {
      window.removeEventListener("storage", syncSession)
      window.removeEventListener("aurora-auth-change", syncSession)
    }
  }, [])

  function logout() {
    window.localStorage.removeItem(placeholderSessionKey)
    window.dispatchEvent(new Event("aurora-auth-change"))
    setIsLoggedIn(false)
    router.push("/")
  }

  if (isLoggedIn) {
    return (
      <>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button type="button" size="lg" onClick={logout}>
          Logout
        </Button>
      </>
    )
  }

  return (
    <>
      <Button asChild variant="outline" size="lg">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild size="lg">
        <Link href="/register">
          Create Account
          <IconArrowRight className="size-4" />
        </Link>
      </Button>
    </>
  )
}
