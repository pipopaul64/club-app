import Link from 'next/link'
import { getFinanceSummary } from '@/app/dashboard/finance/actions'

function formatCents(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    centimes / 100,
  )
}

export default async function AdminFinancePage() {
  const summary = await getFinanceSummary()

  const balancePositive = summary.balance >= 0

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Finances du club
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Vue consolidée des recettes, dépenses et solde
        </p>
      </div>

      {/* Solde — carte principale */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: balancePositive ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${balancePositive ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: '#8e8a9c' }}>
          Solde estimé
        </p>
        <p
          className="text-4xl font-bold"
          style={{ color: balancePositive ? '#166534' : '#991b1b' }}
        >
          {formatCents(summary.balance)}
        </p>
        <p className="text-xs mt-2" style={{ color: '#8e8a9c' }}>
          Cotisations payées + sponsors actifs − dépenses
        </p>
      </div>

      {/* Grille des métriques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Cotisations */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
            💰 Cotisations
          </p>
          <p className="text-2xl font-bold" style={{ color: '#353148' }}>
            {formatCents(summary.cotisPaid)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>encaissées</p>
          {summary.cotisLateCount > 0 && (
            <p className="text-xs mt-2 font-medium" style={{ color: '#c0392b' }}>
              ⚠ {summary.cotisLateCount} en retard
            </p>
          )}
          <Link
            href="/dashboard/admin/cotisations"
            className="mt-3 inline-block text-xs font-medium"
            style={{ color: '#8c60f3' }}
          >
            Gérer →
          </Link>
        </div>

        {/* Dépenses */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
            📤 Dépenses
          </p>
          <p className="text-2xl font-bold" style={{ color: '#353148' }}>
            {formatCents(summary.expenseTotal)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>total engagé</p>
          <Link
            href="/dashboard/admin/expenses"
            className="mt-3 inline-block text-xs font-medium"
            style={{ color: '#8c60f3' }}
          >
            Voir →
          </Link>
        </div>

        {/* Sponsors */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
            🤝 Sponsors
          </p>
          <p className="text-2xl font-bold" style={{ color: '#353148' }}>
            {formatCents(summary.sponsorTotal)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
            {summary.sponsorCount} actif{summary.sponsorCount !== 1 ? 's' : ''}
          </p>
          <Link
            href="/dashboard/admin/sponsors"
            className="mt-3 inline-block text-xs font-medium"
            style={{ color: '#8c60f3' }}
          >
            Gérer →
          </Link>
        </div>
      </div>

      {/* Raccourcis */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: '#f8f6fc', border: '1px solid #e4e0ec' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
          Actions rapides
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/cotisations/new"
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#8c60f3', color: '#ffffff' }}
          >
            + Cotisation
          </Link>
          <Link
            href="/dashboard/admin/expenses/new"
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#ffffff', color: '#353148', border: '1px solid #e4e0ec' }}
          >
            + Dépense
          </Link>
          <Link
            href="/dashboard/admin/sponsors/new"
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#ffffff', color: '#353148', border: '1px solid #e4e0ec' }}
          >
            + Sponsor
          </Link>
        </div>
      </div>
    </div>
  )
}
