import { ClinicTeam } from "@/components/clinics/clinic-team"
import { canManageClinic, requireClinicMember } from "@/lib/clinics/membership"
import { listClinicInvitations, listClinicMembers } from "@/lib/clinics/queries"
import { clinicUrl } from "@/lib/clinics/subdomain"

export async function ClinicTeamLoader() {
  const session = await requireClinicMember()
  const organizationId = session.tenant.organizationId

  const [members, invitations] = await Promise.all([
    listClinicMembers(organizationId),
    listClinicInvitations(organizationId),
  ])

  return (
    <ClinicTeam
      members={members}
      invitations={invitations}
      canManage={canManageClinic(session.role)}
      seatLimit={session.tenant.plan?.seatLimit ?? null}
      joinUrlBase={clinicUrl(session.tenant.subdomain, "/clinic-join").replace(/\/$/, "")}
    />
  )
}
