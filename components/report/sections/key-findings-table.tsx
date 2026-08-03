// Spec section 6.
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function KeyFindingsTable({ vm }: { vm: ReportViewModel }) {
  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>Key Findings</CardTitle>
        <CardDescription>What Aurora Organics&apos; AI noticed, why it matters, and what to do about it.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead>Observation</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vm.findingsRows.map((row) => (
              <TableRow key={row.finding} className="print:break-inside-avoid">
                <TableCell>
                  <Badge variant={row.priorityBadgeVariant}>{row.priorityLabel}</Badge>
                </TableCell>
                <TableCell className="font-medium">{row.finding}</TableCell>
                <TableCell className="text-muted-foreground">{row.observation}</TableCell>
                <TableCell className="text-muted-foreground">{row.impact}</TableCell>
                <TableCell className="max-w-[16rem] text-muted-foreground">{row.recommendation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
