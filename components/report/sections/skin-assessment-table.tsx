// Spec section 3. Rows are built dynamically from whatever the AI actually
// assessed (report-view-model.ts's buildAssessmentRows), not a hardcoded
// fixed list — the AI adapter only ever returns 4-6 findings, and showing a
// row for a concern that was never assessed would be dishonest.
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function SkinAssessmentTable({ vm }: { vm: ReportViewModel }) {
  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>Skin Assessment Overview</CardTitle>
        <CardDescription>A summary of every area Aurora Organics&apos; AI assessed in this scan.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>AI Confidence</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vm.assessmentRows.map((row) => (
              <TableRow key={row.area}>
                <TableCell className="font-medium">{row.area}</TableCell>
                <TableCell>
                  <Badge variant={row.statusBadgeVariant}>{row.statusLabel}</Badge>
                </TableCell>
                <TableCell>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(row.fillRatio * 100)}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{vm.executiveSummary.confidenceLabel}</TableCell>
                <TableCell>
                  <Badge variant={row.priorityBadgeVariant}>{row.priorityLabel}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
