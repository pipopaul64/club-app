import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost } from '@/app/dashboard/admin/posts/actions'
import { EditPostForm } from './_components/EditPostForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/admin/posts"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Publications
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Modifier la publication
        </h1>
      </div>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <EditPostForm post={post} />
      </div>
    </div>
  )
}
