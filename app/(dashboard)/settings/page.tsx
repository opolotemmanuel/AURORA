import Link from "next/link"
import { Suspense } from "react"

import { ClimateSection } from "@/components/dashboard/climate-section"
import { SettingsAccountSection } from "@/components/dashboard/settings-account-section"
import { SettingsPageHeader } from "@/components/dashboard/settings-page-header"
import { ClimateSectionSkeleton } from "@/components/dashboard/skeletons/climate-section-skeleton"
import { PageHeaderSkeleton } from "@/components/dashboard/skeletons/page-header-skeleton"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function AccountSectionSkeleton() {
  return (
    <section className="rounded-xl border border-border p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </section>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<PageHeaderSkeleton withBadge />}>
        <SettingsPageHeader />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<AccountSectionSkeleton />}>
          <SettingsAccountSection />
        </Suspense>

        <Suspense fallback={<ClimateSectionSkeleton />}>
          <ClimateSection />
        </Suspense>
      </div>

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
    </div>
  )
}
