import Link from 'next/link'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { isNotNull } from 'drizzle-orm'

// Toujours rendu côté serveur (données fraîches à chaque requête)
export const dynamic = 'force-dynamic'

/**
 * Page vitrine publique — affiche les publications publiées du club.
 * Accessible sans authentification.
 * Pour le MVP : un seul club. À adapter en multi-tenant via slug/domaine.
 */
async function getPublishedPosts() {
  return db.query.posts.findMany({
    where: isNotNull(posts.publishedAt),
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
  })
}

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  result: {
    label:  'Résultat',
    emoji:  '🏆',
    color:  '#c0392b',
    bg:     '#fdf0f0',
    border: '#f5c6c6',
  },
  news: {
    label:  'Actualité',
    emoji:  '📰',
    color:  '#2563eb',
    bg:     '#eff6ff',
    border: '#bfdbfe',
  },
}

export default async function VitrinePage() {
  const publishedPosts = await getPublishedPosts()

  const results = publishedPosts.filter((p) => p.type === 'result')
  const news    = publishedPosts.filter((p) => p.type === 'news')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6fc' }}>
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: '#353148' }}>ClubOS</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
          >
            Vitrine
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ color: '#8c60f3', border: '1px solid #d4c8f8' }}
        >
          Connexion →
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Aucune publication */}
        {publishedPosts.length === 0 && (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}>
            <p className="text-4xl mb-3">⚽</p>
            <p className="text-base font-medium" style={{ color: '#353148' }}>La vitrine est vide pour l&apos;instant</p>
            <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
              Les résultats et actualités apparaîtront ici.
            </p>
          </div>
        )}

        {/* Résultats */}
        {results.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
              🏆 Derniers résultats
            </h2>
            <div className="space-y-3">
              {results.map((post) => {
                const cfg = TYPE_CONFIG.result
                const dateStr = new Date(post.publishedAt!).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })

                return (
                  <div
                    key={post.id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: '#ffffff', border: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-xs" style={{ color: '#8e8a9c' }}>
                        {dateStr}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#353148', lineHeight: '1.6' }}>
                      {post.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Actualités */}
        {news.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
              📰 Actualités
            </h2>
            <div className="space-y-3">
              {news.map((post) => {
                const cfg = TYPE_CONFIG.news
                const dateStr = new Date(post.publishedAt!).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })

                return (
                  <div
                    key={post.id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: '#ffffff', border: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-xs" style={{ color: '#8e8a9c' }}>
                        {dateStr}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#353148', lineHeight: '1.6' }}>
                      {post.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-4">
          <p className="text-xs" style={{ color: '#b0acbc' }}>
            Propulsé par{' '}
            <Link href="/" className="hover:underline" style={{ color: '#8c60f3' }}>
              ClubOS
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}
