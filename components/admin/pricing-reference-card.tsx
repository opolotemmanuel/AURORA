import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/db/client"
import { getScanTokenCost } from "@/lib/scan/constants"
import {
  formatCreditUsdValue,
  getCreditValueMicros,
  getPricingMarginBps,
} from "@/lib/tokens/pricing"

function formatMicroUsdPer1M(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(4)}`
}

export async function PricingReferenceCard() {
  const rates = await prisma.aiModelRate.findMany({
    where: { isActive: true },
    orderBy: [{ provider: "asc" }, { modelId: "asc" }],
  })

  const creditValueMicros = getCreditValueMicros()
  const marginBps = getPricingMarginBps()
  const marginPercent = (marginBps / 100).toFixed(1)
  const flatFloor = getScanTokenCost()

  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h2 className="font-heading text-lg font-medium">Pricing reference</h2>
        <p className="text-sm text-muted-foreground">
          Usage-based debits convert provider token costs into Aura credits. Mock
          scans use the flat floor until real AI usage is recorded. Manage models
          on the{" "}
          <a href="/admin/models" className="text-foreground underline">
            models page
          </a>
          .
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Credit value</dt>
          <dd className="font-medium">
            1 credit = {formatCreditUsdValue(1)} (
            {creditValueMicros.toLocaleString()} micro-USD)
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Margin</dt>
          <dd className="font-medium">{marginPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Flat scan floor</dt>
          <dd className="font-medium">
            {flatFloor.toLocaleString()} credits (
            {formatCreditUsdValue(flatFloor)})
          </dd>
        </div>
      </dl>

      {rates.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Input / 1M</TableHead>
              <TableHead>Output / 1M</TableHead>
              <TableHead>Cached / 1M</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <div className="font-medium">
                    {rate.displayName ?? rate.modelId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rate.provider} · {rate.modelId}
                  </div>
                </TableCell>
                <TableCell>
                  {formatMicroUsdPer1M(rate.inputMicrosPer1M)}
                </TableCell>
                <TableCell>
                  {formatMicroUsdPer1M(rate.outputMicrosPer1M)}
                </TableCell>
                <TableCell>
                  {formatMicroUsdPer1M(rate.cachedInputMicrosPer1M)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No active model rates seeded yet. Run{" "}
          <code className="font-mono text-xs">npm run db:seed-rates</code>.
        </p>
      )}
    </section>
  )
}
