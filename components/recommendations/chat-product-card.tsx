// Compact product card for AI chat bubbles (report-chat-panel.tsx and
// skin-advice-chat.tsx) — same visual language as the full report-page card
// (components/report/sections/recommended-products.tsx: aspect-square
// bg-muted image tile, outline Button + IconExternalLink Purchase link) just
// condensed to fit inline under a chat message instead of a 3-column grid.
import Image from "next/image"
import { IconExternalLink } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { resolveIngredients } from "@/lib/products/ingredients"
import type { AuroraProduct } from "@/lib/recommendations/types"

export function ChatProductCard({ product }: { product: AuroraProduct }) {
  const ingredients = resolveIngredients(product.keyIngredients)

  return (
    <div className="flex w-40 shrink-0 flex-col gap-2 rounded-lg border border-border bg-background p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        {product.imagePath ? (
          <Image src={product.imagePath} alt={product.name} fill sizes="160px" className="object-cover" />
        ) : null}
      </div>

      <p className="text-xs leading-4 font-medium text-foreground">{product.name}</p>

      {ingredients.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {ingredients.map((ingredient) => (
            <Tooltip key={ingredient.name}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-default px-1.5 py-0.5 normal-case">
                  {ingredient.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48 text-wrap">
                {ingredient.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : null}

      {product.officialUrl ? (
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <a href={product.officialUrl} target="_blank" rel="noopener noreferrer">
            Purchase
            <IconExternalLink className="size-3" />
          </a>
        </Button>
      ) : null}
    </div>
  )
}
