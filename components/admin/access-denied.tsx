import Link from "next/link"
import { IconShieldOff } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function AccessDenied({ note }: { note: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md">
        <CardHeader className="items-center text-center">
          <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <IconShieldOff className="size-6" />
          </div>
          <CardTitle className="mt-2">Access denied</CardTitle>
          <CardDescription>{note}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
