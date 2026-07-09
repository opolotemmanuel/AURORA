// Builds the "print-html" download format (see DownloadFormat in
// lib/backend/types.ts): a standalone, self-styled HTML document users
// print or "Save as PDF" from their browser — the interim stand-in for the
// React-PDF/headless-Chrome pipeline in AGENTS.md's Planned Stack. It's a
// separate document from the app shell, not a rendered app route, so it
// can't use Tailwind/theme tokens or `cn()` — hence the inline styles and
// literal hex colors below, which are appropriate here even though they'd
// violate the app's own "no hardcoded colors" UI rule anywhere else.
import type { StoredReport } from "@/lib/backend/types"

export function renderPrintableReport(report: StoredReport) {
  const findings = report.analysis.cosmeticFindings
    .map(
      (finding) => `
        <tr>
          <td>${escapeHtml(finding.label)}</td>
          <td>${escapeHtml(finding.band.replace("_", " "))}</td>
          <td>${escapeHtml(finding.observation)}</td>
        </tr>
      `,
    )
    .join("")

  const recommendations = report.recommendations
    .map(
      (match) => `
        <li>
          <strong>${escapeHtml(match.product.name)}</strong>
          <span>${escapeHtml(match.reasons.join(" "))}</span>
        </li>
      `,
    )
    .join("")

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aurora SkinSense Report ${escapeHtml(report.id)}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #221f1c; line-height: 1.5; }
      h1, h2 { margin: 0 0 12px; }
      .meta, .disclaimer { color: #6f6760; font-size: 13px; }
      section { margin-top: 28px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd8d2; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #f6f2ee; }
      li { margin-bottom: 12px; }
      li span { display: block; color: #6f6760; }
      @media print { body { margin: 24px; } .print-button { display: none; } }
    </style>
  </head>
  <body>
    <button class="print-button" onclick="window.print()">Print or save as PDF</button>
    <h1>Aurora SkinSense Cosmetic Report</h1>
    <p class="meta">Report ${escapeHtml(report.id)} | Scan ${escapeHtml(report.scanId)} | ${escapeHtml(report.createdAt)}</p>
    <section>
      <h2>Summary</h2>
      <p>${escapeHtml(report.analysis.summary)}</p>
    </section>
    <section>
      <h2>Cosmetic Findings</h2>
      <table>
        <thead>
          <tr><th>Area</th><th>Band</th><th>Observation</th></tr>
        </thead>
        <tbody>${findings}</tbody>
      </table>
    </section>
    <section>
      <h2>Aurora Recommendations</h2>
      <ol>${recommendations}</ol>
    </section>
    <section>
      <h2>Routine Tips</h2>
      <ul>${report.analysis.routineTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
    </section>
    <section class="disclaimer">
      ${escapeHtml(report.analysis.disclaimer)}
    </section>
  </body>
</html>`
}

// Every piece of report data interpolated into the HTML string above goes
// through this first — since the whole document is hand-built string
// concatenation (no JSX/DOM escaping to rely on), skipping this on any
// field would be a stored-XSS hole the moment that field contains user- or
// model-influenced text.
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
