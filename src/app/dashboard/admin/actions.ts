'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createUserSchema, updateUserSchema } from '@/lib/validations'
import { eq, and, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

const REVALIDATE = '/dashboard/admin/users'

// ---------------------------------------------------------------------------
// Contexte admin — session + rôle + clubId
// Factorisé pour éviter la répétition dans chaque action
// ---------------------------------------------------------------------------
async function getAdminContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const ok = await checkRole(session.user.id, ['admin'])
  if (!ok) throw new Error('Forbidden')

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')

  return { session, clubId }
}

// ---------------------------------------------------------------------------
// listUsers — lecture seule, filtre clubId + soft delete
// ---------------------------------------------------------------------------
export async function listUsers() {
  const { clubId } = await getAdminContext()

  return db.query.users.findMany({
    where: and(eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      birthDate: true,
      createdAt: true,
    },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
}

// ---------------------------------------------------------------------------
// getUser — pour le formulaire d'édition
// ---------------------------------------------------------------------------
export async function getUser(id: string) {
  const { clubId } = await getAdminContext()

  return db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      birthDate: true,
    },
  })
}

// ---------------------------------------------------------------------------
// createUser — crée un licencié dans le club de la session
// ---------------------------------------------------------------------------
export async function createUser(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    birthDate: formData.get('birthDate') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, email, phone, role, birthDate } = parsed.data

  // Unicité email dans le club
  const existing = await db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (existing) {
    return { success: false, error: 'Un licencié avec cet email existe déjà dans ce club' }
  }

  await db.insert(users).values({
    id: crypto.randomUUID(),
    clubId, // toujours depuis la session, jamais depuis le client
    name,
    email,
    phone: phone || null,
    role,
    birthDate: birthDate ? new Date(birthDate) : null,
    emailVerified: false,
  })

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// updateUser — modifie un licencié du club de la session
// ---------------------------------------------------------------------------
export async function updateUser(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    birthDate: formData.get('birthDate') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, email, phone, role, birthDate } = parsed.data

  // Ownership check : clubId depuis la session, jamais depuis le client
  await db
    .update(users)
    .set({
      name,
      email,
      phone: phone || null,
      role,
      birthDate: birthDate ? new Date(birthDate) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deactivateUser — soft delete (deletedAt = now())
// ---------------------------------------------------------------------------
export async function deactivateUser(id: string): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  // Ownership check : on ne peut désactiver que des users du même club
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}
