'use server'

import { db } from '@/db'
import { cotisations, expenses, sponsors, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import {
  createCotisationSchema,
  createExpenseSchema,
  createSponsorSchema,
  updateSponsorSchema,
} from '@/lib/validations'
import { eq, and, or, isNull, gte, sum, count, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { CotisationStatus } from '@/db/schema'

// ===========================================================================
// AUTH HELPERS
// ===========================================================================

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  return { userId: session.user.id, clubId }
}

// ===========================================================================
// RÉSUMÉ FINANCIER (Admin)
// ===========================================================================

export async function getFinanceSummary() {
  const { clubId } = await requireAdmin()
  const now = new Date()

  const [cotisResult, cotisLateResult, expenseResult, sponsorResult] = await Promise.all([
    db
      .select({ paid: sum(cotisations.amount) })
      .from(cotisations)
      .where(and(eq(cotisations.clubId, clubId), eq(cotisations.status, 'paid'))),
    db
      .select({ cnt: count() })
      .from(cotisations)
      .where(and(eq(cotisations.clubId, clubId), eq(cotisations.status, 'late'))),
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.clubId, clubId)),
    db
      .select({ total: sum(sponsors.amount), cnt: count() })
      .from(sponsors)
      .where(
        and(
          eq(sponsors.clubId, clubId),
          or(isNull(sponsors.endDate), gte(sponsors.endDate, now)),
        ),
      ),
  ])

  const cotisPaid    = Number(cotisResult[0]?.paid    ?? 0)
  const expenseTotal = Number(expenseResult[0]?.total ?? 0)
  const sponsorTotal = Number(sponsorResult[0]?.total ?? 0)

  return {
    cotisPaid,
    cotisLateCount: Number(cotisLateResult[0]?.cnt ?? 0),
    expenseTotal,
    sponsorTotal,
    sponsorCount:   Number(sponsorResult[0]?.cnt   ?? 0),
    balance:        cotisPaid + sponsorTotal - expenseTotal,
  }
}

// ===========================================================================
// COTISATIONS (Admin seulement)
// ===========================================================================

export async function listCotisations() {
  const { clubId } = await requireAdmin()

  return db.query.cotisations.findMany({
    where: eq(cotisations.clubId, clubId),
    with: { user: { columns: { id: true, name: true, email: true } } },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })
}

export async function createCotisation(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const parsed = createCotisationSchema.safeParse({
    userId:  formData.get('userId'),
    amount:  formData.get('amount'),
    dueDate: formData.get('dueDate'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  // Vérifier que le licencié appartient bien au club
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, parsed.data.userId),
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (!user) return { success: false, error: 'Licencié introuvable' }

  await db.insert(cotisations).values({
    id:      crypto.randomUUID(),
    userId:  parsed.data.userId,
    clubId,
    amount:  Math.round(parsed.data.amount * 100), // euros → centimes
    status:  'pending',
    dueDate: new Date(parsed.data.dueDate),
  })

  revalidatePath('/dashboard/admin/cotisations')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

export async function updateCotisationStatus(
  cotisationId: string,
  status: CotisationStatus,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const cot = await db.query.cotisations.findFirst({
    where: and(eq(cotisations.id, cotisationId), eq(cotisations.clubId, clubId)),
    columns: { id: true },
  })
  if (!cot) return { success: false, error: 'Cotisation introuvable' }

  await db
    .update(cotisations)
    .set({
      status,
      paidAt: status === 'paid' ? new Date() : null,
    })
    .where(and(eq(cotisations.id, cotisationId), eq(cotisations.clubId, clubId)))

  revalidatePath('/dashboard/admin/cotisations')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

export async function deleteCotisation(cotisationId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const cot = await db.query.cotisations.findFirst({
    where: and(eq(cotisations.id, cotisationId), eq(cotisations.clubId, clubId)),
    columns: { id: true },
  })
  if (!cot) return { success: false, error: 'Cotisation introuvable' }

  await db.delete(cotisations).where(
    and(eq(cotisations.id, cotisationId), eq(cotisations.clubId, clubId)),
  )

  revalidatePath('/dashboard/admin/cotisations')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

// ===========================================================================
// DÉPENSES (Admin seulement)
// ===========================================================================

export async function listAllExpenses() {
  const { clubId } = await requireAdmin()

  return db.query.expenses.findMany({
    where: eq(expenses.clubId, clubId),
    with: { author: { columns: { id: true, name: true } } },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  })
}

export async function createExpense(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId, clubId } = await requireAdmin()

  const parsed = createExpenseSchema.safeParse({
    amount:      formData.get('amount'),
    category:    formData.get('category'),
    description: formData.get('description') || undefined,
    receiptUrl:  formData.get('receiptUrl')   || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  await db.insert(expenses).values({
    id:          crypto.randomUUID(),
    clubId,
    authorId:    userId,
    amount:      Math.round(parsed.data.amount * 100), // euros → centimes
    category:    parsed.data.category,
    description: parsed.data.description ?? null,
    receiptUrl:  parsed.data.receiptUrl  ?? null,
  })

  revalidatePath('/dashboard/admin/expenses')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const expense = await db.query.expenses.findFirst({
    where: and(eq(expenses.id, expenseId), eq(expenses.clubId, clubId)),
    columns: { id: true },
  })
  if (!expense) return { success: false, error: 'Dépense introuvable' }

  await db.delete(expenses).where(
    and(eq(expenses.id, expenseId), eq(expenses.clubId, clubId)),
  )

  revalidatePath('/dashboard/admin/expenses')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

// ===========================================================================
// SPONSORS (Admin seulement)
// ===========================================================================

export async function listSponsors() {
  const { clubId } = await requireAdmin()

  return db.query.sponsors.findMany({
    where: eq(sponsors.clubId, clubId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  })
}

export async function createSponsor(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const parsed = createSponsorSchema.safeParse({
    name:      formData.get('name'),
    amount:    formData.get('amount'),
    startDate: formData.get('startDate'),
    endDate:   formData.get('endDate') || undefined,
    notes:     formData.get('notes')   || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  await db.insert(sponsors).values({
    id:        crypto.randomUUID(),
    clubId,
    name:      parsed.data.name,
    amount:    Math.round(parsed.data.amount * 100), // euros → centimes
    startDate: new Date(parsed.data.startDate),
    endDate:   parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    notes:     parsed.data.notes ?? null,
  })

  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

export async function updateSponsor(
  sponsorId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const sponsor = await db.query.sponsors.findFirst({
    where: and(eq(sponsors.id, sponsorId), eq(sponsors.clubId, clubId)),
    columns: { id: true },
  })
  if (!sponsor) return { success: false, error: 'Sponsor introuvable' }

  const parsed = updateSponsorSchema.safeParse({
    name:      formData.get('name'),
    amount:    formData.get('amount'),
    startDate: formData.get('startDate'),
    endDate:   formData.get('endDate') || undefined,
    notes:     formData.get('notes')   || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  await db
    .update(sponsors)
    .set({
      name:      parsed.data.name,
      amount:    Math.round(parsed.data.amount * 100),
      startDate: new Date(parsed.data.startDate),
      endDate:   parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      notes:     parsed.data.notes ?? null,
    })
    .where(and(eq(sponsors.id, sponsorId), eq(sponsors.clubId, clubId)))

  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}

export async function deleteSponsor(sponsorId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const sponsor = await db.query.sponsors.findFirst({
    where: and(eq(sponsors.id, sponsorId), eq(sponsors.clubId, clubId)),
    columns: { id: true },
  })
  if (!sponsor) return { success: false, error: 'Sponsor introuvable' }

  await db.delete(sponsors).where(
    and(eq(sponsors.id, sponsorId), eq(sponsors.clubId, clubId)),
  )

  revalidatePath('/dashboard/admin/sponsors')
  revalidatePath('/dashboard/admin/finance')
  return { success: true, data: undefined }
}
