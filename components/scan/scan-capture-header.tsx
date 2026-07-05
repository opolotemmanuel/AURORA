"use client"

import Image from "next/image"
import Link from "next/link"
import { IconCamera, IconUpload, IconVideo } from "@tabler/icons-react"

import { TabsList, TabsTrigger } from "@/components/motion/tabs"
import { ScanDashboardLink } from "@/components/scan/scan-close-button"
import { Badge } from "@/components/ui/badge"
import brandIcon from "@/app/icon.png"

type ScanCaptureHeaderProps = {
  isPro: boolean
}

export function ScanCaptureHeader({ isPro }: ScanCaptureHeaderProps) {
  return (
    <div className="mb-4 flex w-full max-w-2xl items-center justify-between gap-4">
      <Link
        href="/"
        className="flex min-w-0 shrink items-center gap-2.5 text-foreground transition-colors hover:text-muted-foreground"
      >
        <Image
          src={brandIcon}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-md"
        />
        <span className="font-heading truncate text-sm font-medium tracking-wide">
          Aurora Organics
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <TabsList className="w-fit">
          <TabsTrigger value="upload" className="gap-1.5 px-3">
            <IconUpload className="size-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="camera" className="gap-1.5 px-3">
            <IconCamera className="size-3.5" />
            <span className="hidden sm:inline">Camera</span>
          </TabsTrigger>
          <TabsTrigger
            value="live"
            className="gap-1.5 px-3 data-[disabled=true]:opacity-50"
            data-disabled={!isPro}
          >
            <IconVideo className="size-3.5" />
            <span className="hidden sm:inline">Live</span>
            {!isPro ? (
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                Pro
              </Badge>
            ) : (
              <Badge className="ml-1 hidden sm:inline-flex">Pro</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <ScanDashboardLink variant="segment" />
      </div>
    </div>
  )
}
