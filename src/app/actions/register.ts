'use server'

import { db } from '@/db'
import { clubs, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ActionResult } from '@/types'

const registerSchema = z.object({
  clubName: z.string().min(2, 'Nom du club trop court'),
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
})

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function registerClub(
  formData: FormData,
): Promise<ActionResult<{ redirect: string }>> {
  // 1. Valider les inputs
  const parsed = registerSchema.safeParse({
    clubName: formData.get('clubName'),
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { clubName, name, email, password } = parsed.data

  // 2. Vérifier que le slug n'existe pas déjà
  const slug = toSlug(clubName)
  const existing = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  })
  if (existing) {
    return { success: false, error: 'Un club avec ce nom existe déjà' }
  }

  // 3. Créer le club
  const clubId = crypto.randomUUID()
  await db.insert(clubs).values({
    id: clubId,
    name: clubName,
    slug,
  })

  // 4. Créer le compte via Better-Auth
  const signUpResult = await auth.api.signUpEmail({
    body: { email, password, name },
  })

  if (!signUpResult?.user?.id) {
    // Rollback club si l'inscription échoue
    await db.delete(clubs).where(eq(clubs.id, clubId))
    const msg = (signUpResult as unknown as { error?: { message?: string } })
      ?.error?.message
    return { success: false, error: msg ?? 'Échec de la création du compte' }
  }

  // 5. Assigner clubId + rôle admin — toujours côté serveur, jamais depuis le client
  await db
    .update(users)
    .set({ clubId, role: 'admin' })
    .where(eq(users.id, signUpResult.user.id))

  return { success: true, data: { redirect: '/dashboard' } }
}
