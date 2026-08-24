import type { AuditResult } from "@/generated/prisma/client"
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

/**
 * A closed union, so a new event is a deliberate addition rather than a free
 * string that quietly diverges ("scan.create" vs "scan.created").
 *
 * Weighted toward security-sensitive and business-critical actions. Reads of
 * patient data are audited because that is the access a clinic must be able to
 * account for; ordinary navigation is not.
 */
export type AuditAction =
  // Tenant lifecycle
  | "tenant.created"
  | "tenant.updated"
  | "tenant.suspended"
  | "tenant.plan_changed"
  // Membership lifecycle — who may act inside a tenant
  | "membership.created"
  | "membership.role_changed"
  | "membership.suspended"
  | "membership.revoked"
  // Patient data
  | "patient.viewed"
  | "patient.exported"
  // Clinical records
  | "scan.created"
  | "scan.viewed"
  | "report.viewed"
  // Appointments
  | "appointment.created"
  | "appointment.cancelled"
  | "appointment.completed"
  // Money
  | "payment.completed"
  | "payment.failed"
  // Marketplace approvals
  | "expert.approved"
  | "expert.rejected"
  | "affiliate.approved"
  | "affiliate.rejected"
  // Platform control plane
  | "admin.tenant_entered"
  | "admin.data_exported"
  // AI training pipeline
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
  subjectType:
    | "user"
    | "clinic"
    | "membership"
    | "scan"
    | "report"
    | "booking"
    | "payment"
    | "expert"
    | "affiliate"
    | "training_record"
    | "dataset"
  subjectId?: string | null
  actorId?: string | null
  actorRole?: string | null
  /**
   * The tenant the action happened in.
   *
   * Recorded alongside actorId rather than instead of it. A platform admin
   * acting inside a clinic must leave both behind, or the trail cannot answer
   * "who did this, and on whose site".
   */
  organizationId?: string | null
  /** Defaults to success; set "denied" to record a refused attempt. */
  result?: AuditResult
  /** Correlates every entry written while serving one request. */
  requestId?: string | null
  /** Never put patient content, secrets or payment credentials here. */
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
        result: entry.result ?? "success",
        requestId: entry.requestId ?? null,
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
        result: entry.result ?? "success",
        requestId: entry.requestId ?? null,
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

/**
 * Records a refused attempt.
 *
 * Denials are the entries an investigation actually needs — a successful read
 * looks like every other successful read, while a refusal shows someone
 * reaching for something that was not theirs.
 */
export async function recordDenied(
  entry: Omit<AuditEntry, "result">,
): Promise<void> {
  await recordAudit({ ...entry, result: "denied" })
}
