import Link from 'next/link'
import { PostForm } from './_components/PostForm'

export default function NewPostPage() {
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
          Nouvelle publication
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Publiée immédiatement sur la vitrine du club.
        </p>
      </div>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <PostForm />
      </div>
    </div>
  )
}
