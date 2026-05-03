'use server'

import { db } from '@/db'
import { surveys, surveyResponses, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createSurveySchema } from '@/lib/validations'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ===========================================================================
// AUTH HELPERS
// ===========================================================================

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId: session.user.id, clubId, role }
}

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
// LECTURE — ADMIN
// ===========================================================================

export async function listSurveysAdmin() {
  const { clubId } = await requireAdmin()

  const surveyList = await db.query.surveys.findMany({
    where: eq(surveys.clubId, clubId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  })

  // Compter les réponses par sondage
  const responseCounts = await Promise.all(
    surveyList.map(async (survey) => {
      const responses = await db.query.surveyResponses.findMany({
        where: eq(surveyResponses.surveyId, survey.id),
        columns: { id: true, userId: true, answer: true },
        with: { user: { columns: { id: true, name: true } } },
      })
      return { surveyId: survey.id, responses }
    }),
  )

  const responseMap = new Map(responseCounts.map((r) => [r.surveyId, r.responses]))

  return surveyList.map((s) => ({
    ...s,
    responses: responseMap.get(s.id) ?? [],
  }))
}

// ===========================================================================
// LECTURE — USER
// ===========================================================================

export async function listSurveysForUser() {
  const { userId, clubId } = await getSessionContext()

  const surveyList = await db.query.surveys.findMany({
    where: eq(surveys.clubId, clubId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  })

  if (surveyList.length === 0) return []

  // Vérifier quels sondages l'utilisateur a déjà répondus
  const surveyIds = surveyList.map((s) => s.id)
  const existingResponses = await db.query.surveyResponses.findMany({
    where: and(
      eq(surveyResponses.userId, userId),
      inArray(surveyResponses.surveyId, surveyIds),
    ),
    columns: { surveyId: true, answer: true },
  })
  const respondedMap = new Map(existingResponses.map((r) => [r.surveyId, r.answer]))

  return surveyList.map((s) => ({
    ...s,
    hasResponded: respondedMap.has(s.id),
    myAnswer: respondedMap.get(s.id) as { value: 'yes' | 'no' } | undefined,
  }))
}

// ===========================================================================
// MUTATIONS — ADMIN
// ===========================================================================

export async function createSurvey(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const parsed = createSurveySchema.safeParse({
    title: formData.get('title'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  await db.insert(surveys).values({
    id:      crypto.randomUUID(),
    clubId,
    title:   parsed.data.title,
  })

  revalidatePath('/dashboard/admin/surveys')
  revalidatePath('/dashboard/surveys')
  return { success: true, data: undefined }
}

export async function deleteSurvey(surveyId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.clubId, clubId)),
    columns: { id: true },
  })
  if (!survey) return { success: false, error: 'Sondage introuvable' }

  // Supprime aussi les réponses en cascade
  await db.delete(surveys).where(and(eq(surveys.id, surveyId), eq(surveys.clubId, clubId)))

  revalidatePath('/dashboard/admin/surveys')
  revalidatePath('/dashboard/surveys')
  return { success: true, data: undefined }
}

// ===========================================================================
// MUTATIONS — USER
// ===========================================================================

export async function respondToSurvey(
  surveyId: string,
  value: 'yes' | 'no',
): Promise<ActionResult> {
  const { userId, clubId } = await getSessionContext()

  // Vérifier que le sondage appartient au club
  const survey = await db.query.surveys.findFirst({
    where: and(eq(surveys.id, surveyId), eq(surveys.clubId, clubId)),
    columns: { id: true },
  })
  if (!survey) return { success: false, error: 'Sondage introuvable' }

  // Vérifier si déjà répondu
  const existing = await db.query.surveyResponses.findFirst({
    where: and(
      eq(surveyResponses.surveyId, surveyId),
      eq(surveyResponses.userId, userId),
    ),
    columns: { id: true },
  })

  if (existing) {
    // Mettre à jour la réponse existante
    await db
      .update(surveyResponses)
      .set({ answer: { value } })
      .where(
        and(
          eq(surveyResponses.surveyId, surveyId),
          eq(surveyResponses.userId, userId),
        ),
      )
  } else {
    await db.insert(surveyResponses).values({
      id:       crypto.randomUUID(),
      surveyId,
      userId,
      answer:   { value },
    })
  }

  revalidatePath('/dashboard/surveys')
  return { success: true, data: undefined }
}
