import { ClinicsTable } from "@/components/admin/clinics-table"
import { listClinicPlans, listClinics } from "@/lib/admin/clinic-queries"
import { clinicUrl } from "@/lib/clinics/subdomain"
import { requestOrigin } from "@/lib/clinics/request-origin"

export async function ClinicsLoader() {
  const [clinics, plans, origin] = await Promise.all([
    listClinics(),
    listClinicPlans(),
    requestOrigin(),
  ])

  return (
    <ClinicsTable
      // Built here rather than in the table, which is a client component and
      // so cannot read the request host or any server-only configuration.
      clinics={clinics.map((clinic) => ({
        ...clinic,
        url: clinicUrl(clinic.subdomain, "/", origin),
      }))}
      plans={plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        interval: plan.interval,
      }))}
    />
  )
}
