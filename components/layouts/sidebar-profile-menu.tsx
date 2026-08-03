"use client"

// Popout menu for the sidebar's profile entry — shared by the desktop rail
// (bar 1, bottom) and the mobile header's rail row, both part of the
// 3-column sidebar shell (dashboard-sidebar.tsx). Built on DropdownMenu
// (already installed, unlike HoverCard) with a controlled `open` state:
// hovering the trigger/content opens/closes it with a short close delay
// for desktop pointer users, while Radix's own click handling on the
// trigger still toggles it for touch, where mouseenter/mouseleave never
// fire. One component, both interaction modes, no new package — unchanged
// from the original implementation.
//
// The trigger itself is now avatar-only (previously it also showed name +
// email inline) to fit the narrow icon rail this now lives in; that
// information isn't lost, it moved into a label row at the top of the
// dropdown content instead, still visible on open. The 3 actions (View
// profile / Edit profile / Sign out), their hrefs, and the sign-out flow
// are byte-identical to before.
import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconEdit, IconLogout, IconUser, IconUserCircle } from "@tabler/icons-react"

import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Long enough that moving the mouse from the trigger to the content (or a
// brief overshoot) doesn't flicker-close the menu, short enough that it
// doesn't feel sticky.
const CLOSE_DELAY_MS = 200

type SessionUser = NonNullable<ReturnType<typeof authClient.useSession>["data"]>["user"]

export function SidebarProfileMenu({
  user,
  onNavigate,
  popoutSide = "top",
  className,
}: {
  user: SessionUser
  onNavigate?: () => void
  // "top": desktop's vertical rail, trigger sits at the bottom, menu opens
  // upward. "bottom": mobile's horizontal header row, trigger sits at the
  // top of the screen, menu opens downward — "top" there would have no
  // room and rely on Radix's collision-flip alone.
  popoutSide?: "top" | "bottom"
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearCloseTimeout() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
  }

  function openNow() {
    clearCloseTimeout()
    setOpen(true)
  }

  function closeSoon() {
    clearCloseTimeout()
    closeTimeout.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  function handleLinkNavigate() {
    setOpen(false)
    onNavigate?.()
  }

  async function handleSignOut() {
    setOpen(false)
    onNavigate?.()

    // Same post-mutation pattern as login-form.tsx's sign-in: push first
    // (session cookie is already cleared server-side by this point), then
    // refresh so server components re-read the now-signed-out session.
    const { error } = await authClient.signOut()
    if (error) return

    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          aria-label={`Account menu for ${user.name || user.email}`}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md outline-none transition-colors hover:bg-sidebar-accent focus-visible:bg-sidebar-accent",
            className
          )}
        >
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <IconUserCircle className="size-5 text-muted-foreground" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={popoutSide}
        align="start"
        sideOffset={8}
        className="w-56"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <DropdownMenuLabel className="normal-case">
          <p className="truncate text-sm font-medium text-foreground">{user.name || "Aurora Organics user"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" onClick={handleLinkNavigate}>
            <IconUser className="size-4" />
            View profile
          </Link>
        </DropdownMenuItem>
        {/* /profile is the same real destination manage-your-data-card.tsx's
            existing "Edit profile" button already links to — there is no
            separate edit route or ?edit= mode in this app yet (the page is
            still read-only), so this matches that existing precedent
            rather than linking somewhere that doesn't exist. */}
        <DropdownMenuItem asChild>
          <Link href="/profile" onClick={handleLinkNavigate}>
            <IconEdit className="size-4" />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <IconLogout className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
