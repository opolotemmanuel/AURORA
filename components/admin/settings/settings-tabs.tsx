"use client"

// Navigation shell for the Enterprise Settings console — icon rail →
// contextual sub-nav list → main content, replacing the old single-row
// horizontal tab bar (which wrapped into 2 crowded rows across 14 tabs).
// Presentation/navigation only: the 4 real tabs still receive server-
// rendered content as children exactly as before (data fetched in
// app/(dashboard)/settings/page.tsx, which imports this component by the
// same name/props and needed no changes), and every placeholder tab still
// renders the same honest NotAvailablePanel — never a blank tab, never a
// fake control. See settings-nav-config.ts for the category grouping and
// full tab list this is built from.
import { useState } from "react"

import { cn } from "@/lib/utils"
import { NotAvailablePanel } from "@/components/admin/settings/not-available-panel"
import {
  DEFAULT_SETTINGS_CATEGORY,
  DEFAULT_SETTINGS_TAB,
  SETTINGS_CATEGORIES,
  SETTINGS_TABS,
  type SettingsCategoryId,
  type SettingsTabMeta,
} from "@/components/admin/settings/settings-nav-config"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SettingsTabs({
  overview,
  products,
  auditLogs,
  aiServices,
}: {
  overview: React.ReactNode
  products: React.ReactNode
  auditLogs: React.ReactNode
  aiServices: React.ReactNode
}) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>(DEFAULT_SETTINGS_CATEGORY)
  const [mobileListOpen, setMobileListOpen] = useState(false)

  const tabsInActiveCategory = SETTINGS_TABS.filter((tab) => tab.category === activeCategory)
  const activeCategoryLabel = SETTINGS_CATEGORIES.find((category) => category.id === activeCategory)?.label

  function openCategoryOnMobile(category: SettingsCategoryId) {
    setActiveCategory(category)
    setMobileListOpen(true)
  }

  return (
    <Tabs defaultValue={DEFAULT_SETTINGS_TAB} orientation="vertical" className="flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* Desktop: rail + contextual list, always visible side-by-side. */}
      <div className="hidden shrink-0 overflow-hidden rounded-lg border border-border lg:flex">
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3">
          {SETTINGS_CATEGORIES.map((category) => {
            const Icon = category.icon
            const isActive = category.id === activeCategory

            return (
              <button
                key={category.id}
                type="button"
                title={category.label}
                aria-label={category.label}
                aria-pressed={isActive}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </nav>
        <CategoryTabList tabs={tabsInActiveCategory} />
      </div>

      {/* Mobile: rail row of category buttons, each opening a Sheet drawer
          with the same list content. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
        {SETTINGS_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isActive = category.id === activeCategory

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategoryOnMobile(category.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "border-sidebar-border bg-sidebar text-sidebar-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {category.label}
            </button>
          )
        })}
      </div>

      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">{activeCategoryLabel}</SheetTitle>
          </SheetHeader>
          <CategoryTabList tabs={tabsInActiveCategory} onSelect={() => setMobileListOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Column 3: main content — one location, shared by desktop and
          mobile, full width once a mobile Sheet selection closes the
          drawer. */}
      <div className="min-w-0 flex-1">
        <TabsContent value="overview" className="mt-0">
          {overview}
        </TabsContent>
        <TabsContent value="products" className="mt-0">
          {products}
        </TabsContent>
        <TabsContent value="audit-logs" className="mt-0">
          {auditLogs}
        </TabsContent>
        <TabsContent value="ai-services" className="mt-0">
          {aiServices}
        </TabsContent>
        {SETTINGS_TABS.filter((tab) => !tab.isReal).map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            <NotAvailablePanel icon={tab.icon} title={tab.title} description={tab.description} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}

// Shared vertical tab list — the desktop column 2 and the mobile Sheet
// drawer both render this against whatever category's tabs are currently
// active, so the two surfaces can't drift into different label sets or
// styling. Real tabs render normal-weight foreground text; the 10
// honestly-labeled "not available" tabs render muted/secondary text, the
// same real/placeholder signal the old flat tab bar carried.
function CategoryTabList({ tabs, onSelect }: { tabs: SettingsTabMeta[]; onSelect?: () => void }) {
  return (
    <TabsList variant="line" className="h-fit w-56 flex-col items-stretch justify-start gap-1 bg-transparent p-2">
      {tabs.map((tab) => {
        const Icon = tab.icon

        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            onClick={onSelect}
            className={cn(
              "w-full justify-start gap-2.5 px-3 py-2 text-left text-xs font-medium tracking-normal normal-case",
              tab.isReal ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {tab.label}
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
