"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function useTabSearchParam(validTabs: readonly string[], defaultTab: string) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get("tab")
  const tab = validTabs.includes(tabParam ?? "") ? tabParam! : defaultTab

  const setTab = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === defaultTab) {
        params.delete("tab")
      } else {
        params.set("tab", value)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [defaultTab, pathname, router, searchParams],
  )

  return [tab, setTab] as const
}
