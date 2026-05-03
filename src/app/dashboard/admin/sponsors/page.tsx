import Link from 'next/link'
import { listSponsors } from '@/app/dashboard/finance/actions'
import { DeleteSponsorButton } from './_components/DeleteSponsorButton'

function fmt(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    centimes / 100,
  )
}

export default async function AdminSponsorsPage() {
  const sponsorList = await listSponsors()
  const now = new Date()

  const active   = sponsorList.filter((s) => !s.endDate || new Date(s.endDate) >= now)
  const inactive = sponsorList.filter((s) =>  s.endDate && new Date(s.endDate) <  now)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Sponsors</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {active.length} actif{active.length > 1 ? 's' : ''}
            {inactive.length > 0 && ` · ${inactive.length} expiré${inactive.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/admin/sponsors/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouveau
        </Link>
      </div>

      {/* Vide */}
      {sponsorList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucun sponsor enregistré.</p>
          <Link
            href="/dashboard/admin/sponsors/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Ajouter le premier →
          </Link>
        </div>
      )}

      {/* Sponsors actifs */}
      {active.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#8e8a9c' }}
          >
            🤝 Actifs
          </h2>
          <div className="space-y-2">
            {active.map((sponsor) => (
              <SponsorRow key={sponsor.id} sponsor={sponsor} isActive />
            ))}
          </div>
        </section>
      )}

      {/* Sponsors expirés */}
      {inactive.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#8e8a9c' }}
          >
            ⏸ Expirés
          </h2>
          <div className="space-y-2">
            {inactive.map((sponsor) => (
              <SponsorRow key={sponsor.id} sponsor={sponsor} isActive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Lien retour */}
      <Link
        href="/dashboard/admin/finance"
        className="inline-block text-sm"
        style={{ color: '#8e8a9c' }}
      >
        ← Tableau de bord financier
      </Link>
    </div>
  )
}

function SponsorRow({
  sponsor,
  isActive,
}: {
  sponsor: {
    id: string
    name: string
    amount: number
    startDate: Date
    endDate: Date | null
    notes: string | null
  }
  isActive: boolean
}) {
  const startStr = new Date(sponsor.startDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const endStr = sponsor.endDate
    ? new Date(sponsor.endDate).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${isActive ? '#e4e0ec' : '#f0eef8'}`,
        opacity: isActive ? 1 : 0.65,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#353148' }}>
            {sponsor.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
            Depuis {startStr}
            {endStr ? ` → ${endStr}` : ' · Sans échéance'}
          </p>
          {sponsor.notes && (
            <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
              {sponsor.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-sm font-semibold" style={{ color: '#353148' }}>
            {fmt(sponsor.amount)}<span className="text-xs font-normal" style={{ color: '#8e8a9c' }}>/an</span>
          </p>
          <DeleteSponsorButton sponsorId={sponsor.id} />
        </div>
      </div>
    </div>
  )
}
