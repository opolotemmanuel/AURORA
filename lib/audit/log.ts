import { prisma } from "@/lib/db/client"

/**
 * Append-only audit trail for actions on sensitive data.
 *
 * Deliberately never updated or deleted here — an audit trail an application
 * can edit is not one. Rows age out through the retention purge, nowhere else.
 *
 * Writes are best-effort: a failure to record an audit line is logged loudly
 * but does not fail the action the user asked for. The alternative, refusing
 * the action, would mean a full log table could block patients from revoking
 * consent, which is worse than a gap in the trail.
 */

export type AuditAction =
  | "training.consent.granted"
  | "training.consent.revoked"
  | "training.clinic_contribution.enabled"
  | "training.clinic_contribution.disabled"
  | "training.record.collected"
  | "training.record.validated"
  | "training.record.withdrawn"
  | "training.dataset.exported"

export type AuditEntry = {
  action: AuditAction
  subjectType: "user" | "clinic" | "training_record" | "dataset"
  subjectId?: string | null
  actorId?: string | null
  actorRole?: string | null
  organizationId?: string | null
  metadata?: Record<string, unknown>
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        subjectType: entry.subjectType,
        subjectId: entry.subjectId ?? null,
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        organizationId: entry.organizationId ?? null,
        metadata: (entry.metadata ?? {}) as object,
      },
    })
  } catch (error) {
    console.error("[audit] Failed to record entry", { action: entry.action, error })
  }
}

/** Bulk variant, so collecting a batch writes one row per record cheaply. */
export async function recordAuditMany(entries: AuditEntry[]): Promise<void> {
  if (entries.length === 0) return

  try {
    await prisma.auditLog.createMany({
      data: entries.map((entry) => ({
        action: entry.action,
        subjectType: entry.subjectType,
        subjectId: entry.subjectId ?? null,
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        organizationId: entry.organizationId ?? null,
        metadata: (entry.metadata ?? {}) as object,
      })),
    })
  } catch (error) {
    console.error("[audit] Failed to record batch", {
      count: entries.length,
      error,
    })
  }
}
