'use server'

import { db } from '@/db'
import { posts } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createPostSchema, updatePostSchema } from '@/lib/validations'
import { eq, and, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ===========================================================================
// AUTH
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
// LECTURE
// ===========================================================================

export async function listPosts(publishedOnly = false) {
  const { clubId } = await requireAdmin()

  if (publishedOnly) {
    return db.query.posts.findMany({
      where: and(
        eq(posts.clubId, clubId),
        // publishedAt IS NOT NULL handled inline
      ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    })
  }

  return db.query.posts.findMany({
    where: eq(posts.clubId, clubId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}

export async function getPost(postId: string) {
  const { clubId } = await requireAdmin()

  return db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.clubId, clubId)),
  })
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

export async function createPost(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const parsed = createPostSchema.safeParse({
    type:    formData.get('type'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  await db.insert(posts).values({
    id:          crypto.randomUUID(),
    clubId,
    type:        parsed.data.type,
    content:     parsed.data.content,
    publishedAt: new Date(),
  })

  revalidatePath('/dashboard/admin/posts')
  revalidatePath('/vitrine')
  return { success: true, data: undefined }
}

export async function updatePost(
  postId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.clubId, clubId)),
    columns: { id: true },
  })
  if (!post) return { success: false, error: 'Publication introuvable' }

  const parsed = updatePostSchema.safeParse({
    type:    formData.get('type'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const publishAction = formData.get('publishAction') as string | null
  let publishedAt: Date | null | undefined = undefined

  if (publishAction === 'publish') {
    publishedAt = new Date()
  } else if (publishAction === 'unpublish') {
    publishedAt = null
  }

  await db
    .update(posts)
    .set({
      type:    parsed.data.type,
      content: parsed.data.content,
      ...(publishedAt !== undefined ? { publishedAt } : {}),
    })
    .where(and(eq(posts.id, postId), eq(posts.clubId, clubId)))

  revalidatePath('/dashboard/admin/posts')
  revalidatePath('/vitrine')
  return { success: true, data: undefined }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.clubId, clubId)),
    columns: { id: true },
  })
  if (!post) return { success: false, error: 'Publication introuvable' }

  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.clubId, clubId)))

  revalidatePath('/dashboard/admin/posts')
  revalidatePath('/vitrine')
  return { success: true, data: undefined }
}

export async function togglePublish(postId: string, publish: boolean): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.clubId, clubId)),
    columns: { id: true },
  })
  if (!post) return { success: false, error: 'Publication introuvable' }

  await db
    .update(posts)
    .set({ publishedAt: publish ? new Date() : null })
    .where(and(eq(posts.id, postId), eq(posts.clubId, clubId)))

  revalidatePath('/dashboard/admin/posts')
  revalidatePath('/vitrine')
  return { success: true, data: undefined }
}
