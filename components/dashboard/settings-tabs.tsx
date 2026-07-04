"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { Button } from "@/components/ui/button"
import { useTabSearchParam } from "@/hooks/use-tab-search-param"

const SETTINGS_TABS = ["account", "climate", "data"] as const

type SettingsTabsProps = {
  account: ReactNode
  climate: ReactNode
}

export function SettingsTabs({ account, climate }: SettingsTabsProps) {
  const [tab, setTab] = useTabSearchParam(SETTINGS_TABS, "account")

  return (
    <Tabs value={tab} onValueChange={setTab} variant="underline" className="w-full">
      <TabsList className="w-full flex-wrap gap-x-1 gap-y-0">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="climate">Climate</TabsTrigger>
        <TabsTrigger value="data">Your data</TabsTrigger>
      </TabsList>

      <TabsContent value="account">{account}</TabsContent>
      <TabsContent value="climate">{climate}</TabsContent>

      <TabsContent value="data">
        <section className="rounded-xl border border-border p-5">
          <h2 className="font-heading text-sm font-medium">Manage your data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit profile fields or delete personal data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Edit profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/privacy">Privacy & deletion</Link>
            </Button>
          </div>
        </section>
      </TabsContent>
    </Tabs>
  )
}
