import Link from "next/link"

import { LandingFooter } from "@/components/marketing/landing-footer"

/**
 * Shared chrome for the legal documents.
 *
 * Both pages were previously hand-built JSX with their own heading styles,
 * which made them drift. Structure lives here so the content files stay
 * readable as prose and a claim can be checked against the code beside it.
 */
export function LegalPage({
  eyebrow = "Legal",
  title,
  updated,
  version,
  intro,
  toc,
  children,
}: {
  eyebrow?: string
  title: string
  updated: string
  version: string
  intro?: React.ReactNode
  toc: { id: string; label: string }[]
  children: React.ReactNode
}) {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
          <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Version {version}. Last updated {updated}.
          </p>
          {intro ? (
            <div className="text-muted-foreground pt-2 text-sm leading-relaxed">
              {intro}
            </div>
          ) : null}
        </header>

        <nav
          aria-label="Contents"
          className="border-border/60 bg-card/40 mb-12 rounded-2xl border p-5"
        >
          <p className="text-foreground mb-3 text-sm font-medium">Contents</p>
          <ol className="text-muted-foreground grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {toc.map((entry, index) => (
              <li key={entry.id}>
                <Link
                  href={`#${entry.id}`}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  {index + 1}. {entry.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="text-muted-foreground space-y-10 text-sm leading-relaxed">
          {children}
        </div>
      </article>
      <LandingFooter />
    </>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-foreground font-heading text-lg font-medium">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function LegalSubheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-foreground pt-2 text-sm font-medium">{children}</h3>
  )
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>
}

export function Term({ children }: { children: React.ReactNode }) {
  return <strong className="text-foreground font-medium">{children}</strong>
}

/**
 * Table for the retention schedule and the sub-processor list. Scrolls
 * horizontally on narrow screens rather than forcing the page to.
 */
export function LegalTable({
  caption,
  headers,
  rows,
}: {
  caption?: string
  headers: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <div className="border-border/60 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted/40 text-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2.5 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border/50 divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
