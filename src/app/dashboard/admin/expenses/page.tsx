import Link from 'next/link'
import { listAllExpenses } from '@/app/dashboard/finance/actions'
import { DeleteExpenseButton } from './_components/DeleteExpenseButton'

function formatCents(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    centimes / 100,
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  equipement:    '🎽 Équipement',
  deplacement:   '🚌 Déplacement',
  arbitrage:     '🟡 Arbitrage',
  licence:       '📋 Licence',
  communication: '📢 Communication',
  autre:         '📦 Autre',
}

export default async function AdminExpensesPage() {
  const expenseList = await listAllExpenses()

  const totalExpenses = expenseList.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Dépenses</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {expenseList.length} dépense{expenseList.length > 1 ? 's' : ''}
            {expenseList.length > 0 && ` · ${formatCents(totalExpenses)} au total`}
          </p>
        </div>
        <Link
          href="/dashboard/admin/expenses/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouvelle
        </Link>
      </div>

      {/* Vide */}
      {expenseList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucune dépense enregistrée.</p>
          <Link
            href="/dashboard/admin/expenses/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Ajouter la première →
          </Link>
        </div>
      )}

      {/* Liste */}
      {expenseList.length > 0 && (
        <div className="space-y-2">
          {expenseList.map((expense) => {
            const dateStr = new Date(expense.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const catLabel = CATEGORY_LABELS[expense.category] ?? expense.category

            return (
              <div
                key={expense.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: '#6d28d9', backgroundColor: '#ede9fe' }}
                      >
                        {catLabel}
                      </span>
                      <span className="text-xs" style={{ color: '#8e8a9c' }}>
                        par {expense.author.name} · {dateStr}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm" style={{ color: '#353148' }}>
                        {expense.description}
                      </p>
                    )}
                    {expense.receiptUrl && (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 inline-block hover:underline"
                        style={{ color: '#8c60f3' }}
                      >
                        📎 Justificatif
                      </a>
                    )}
                  </div>

                  {/* Montant + suppression */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#353148' }}>
                      {formatCents(expense.amount)}
                    </p>
                    <DeleteExpenseButton expenseId={expense.id} />
                  </div>
                </div>
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
