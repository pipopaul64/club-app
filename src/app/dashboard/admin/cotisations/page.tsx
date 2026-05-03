import Link from 'next/link'
import { listCotisations } from '@/app/dashboard/finance/actions'
import { UpdateCotisationStatusButton } from './_components/UpdateCotisationStatusButton'
import { DeleteCotisationButton } from './_components/DeleteCotisationButton'
import type { CotisationStatus } from '@/db/schema'

function formatCents(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    centimes / 100,
  )
}

const STATUS_LABEL: Record<CotisationStatus, string> = {
  pending: 'En attente',
  paid:    'Payé',
  late:    'En retard',
}

export default async function AdminCotisationsPage() {
  const cotisationList = await listCotisations()

  const paid    = cotisationList.filter((c) => c.status === 'paid')
  const pending = cotisationList.filter((c) => c.status === 'pending')
  const late    = cotisationList.filter((c) => c.status === 'late')

  const totalPaid = paid.reduce((acc, c) => acc + c.amount, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Cotisations</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {paid.length} payée{paid.length > 1 ? 's' : ''} ·{' '}
            {pending.length} en attente ·{' '}
            {late.length > 0 && (
              <span style={{ color: '#c0392b' }}>{late.length} en retard</span>
            )}
            {late.length === 0 && '0 en retard'}
          </p>
        </div>
        <Link
          href="/dashboard/admin/cotisations/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouvelle
        </Link>
      </div>

      {/* Total encaissé */}
      {paid.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <span className="text-sm font-medium" style={{ color: '#166534' }}>
            Total encaissé
          </span>
          <span className="text-lg font-bold" style={{ color: '#166534' }}>
            {formatCents(totalPaid)}
          </span>
        </div>
      )}

      {/* Vide */}
      {cotisationList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucune cotisation enregistrée.</p>
          <Link
            href="/dashboard/admin/cotisations/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Créer la première →
          </Link>
        </div>
      )}

      {/* Liste */}
      {cotisationList.length > 0 && (
        <div className="space-y-2">
          {cotisationList.map((cot) => {
            const dueDateStr = new Date(cot.dueDate).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const paidDateStr = cot.paidAt
              ? new Date(cot.paidAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : null

            return (
              <div
                key={cot.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                {/* Infos licencié */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#353148' }}>
                    {cot.user.name}
                  </p>
                  <p className="text-xs" style={{ color: '#8e8a9c' }}>
                    Échéance : {dueDateStr}
                    {paidDateStr && ` · Payé le ${paidDateStr}`}
                  </p>
                </div>

                {/* Montant */}
                <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#353148' }}>
                  {formatCents(cot.amount)}
                </p>

                {/* Statut (cliquable) */}
                <UpdateCotisationStatusButton
                  cotisationId={cot.id}
                  currentStatus={cot.status as CotisationStatus}
                />

                {/* Suppression */}
                <DeleteCotisationButton cotisationId={cot.id} />
              </div>
            )
          })}
        </div>
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
