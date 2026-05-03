import Link from 'next/link'
import { listPosts } from './actions'
import { DeletePostButton } from './_components/DeletePostButton'
import { TogglePublishButton } from './_components/TogglePublishButton'

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  result: { label: '🏆 Résultat',  color: '#c0392b', bg: '#fdf0f0' },
  news:   { label: '📰 Actualité', color: '#2563eb', bg: '#eff6ff' },
}

export default async function AdminPostsPage() {
  const postList = await listPosts()

  const published = postList.filter((p) => p.publishedAt !== null)
  const drafts    = postList.filter((p) => p.publishedAt === null)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Vitrine — Publications
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {published.length} publiée{published.length > 1 ? 's' : ''} · {drafts.length} brouillon{drafts.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/admin/posts/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouveau
        </Link>
      </div>

      {/* Vide */}
      {postList.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px solid #e4e0ec' }}>
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucune publication pour le moment.</p>
          <Link
            href="/dashboard/admin/posts/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Créer une publication →
          </Link>
        </div>
      )}

      {/* Liste */}
      {postList.length > 0 && (
        <div className="space-y-3">
          {postList.map((post) => {
            const typeCfg = TYPE_LABELS[post.type] ?? TYPE_LABELS.news
            const isPublished = post.publishedAt !== null
            const dateStr = new Date(post.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })

            return (
              <div
                key={post.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
                      >
                        {typeCfg.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={
                          isPublished
                            ? { color: '#166534', backgroundColor: '#dcfce7' }
                            : { color: '#92400e', backgroundColor: '#fef3c7' }
                        }
                      >
                        {isPublished ? '✓ Publiée' : '⏸ Brouillon'}
                      </span>
                      <span className="text-xs ml-auto" style={{ color: '#8e8a9c' }}>
                        {dateStr}
                      </span>
                    </div>
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: '#353148' }}
                    >
                      {post.content}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f0eef8' }}>
                  <Link
                    href={`/dashboard/admin/posts/${post.id}/edit`}
                    className="text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                    style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                  >
                    Modifier
                  </Link>
                  <TogglePublishButton postId={post.id} isPublished={isPublished} />
                  <div className="ml-auto">
                    <DeletePostButton postId={post.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
