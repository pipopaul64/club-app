import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  /** Base URL (without ?page=). Query params are appended. */
  baseUrl: string
  /** Any extra search params to preserve (e.g. filters) */
  params?: Record<string, string>
}

export function Pagination({ page, totalPages, baseUrl, params = {} }: Props) {
  if (totalPages <= 1) return null

  function buildHref(p: number) {
    const q = new URLSearchParams({ ...params, page: String(p) })
    return `${baseUrl}?${q.toString()}`
  }

  // Show a sliding window of 5 pages max
  const range: number[] = []
  const half = 2
  let start = Math.max(1, page - half)
  let end   = Math.min(totalPages, page + half)
  if (end - start < 4) {
    if (start === 1) end   = Math.min(totalPages, start + 4)
    else             start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) range.push(i)

  const btnBase = 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors'
  const active  = { backgroundColor: '#8c60f3', color: '#ffffff' }
  const normal  = { border: '1px solid #e4e0ec', color: '#353148' }

  return (
    <nav className="flex items-center gap-1.5 mt-6" aria-label="Pagination">
      {/* Previous */}
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={btnBase}
          style={normal}
          aria-label="Page précédente"
        >
          ‹
        </Link>
      ) : (
        <span
          className={`${btnBase} opacity-30 cursor-not-allowed`}
          style={normal}
          aria-disabled="true"
        >
          ‹
        </span>
      )}

      {/* First page + ellipsis */}
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className={btnBase} style={normal}>1</Link>
          {start > 2 && <span className="px-1 text-sm" style={{ color: '#b0acbc' }}>…</span>}
        </>
      )}

      {/* Page range */}
      {range.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={btnBase}
          style={p === page ? active : normal}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {/* Ellipsis + last page */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-sm" style={{ color: '#b0acbc' }}>…</span>}
          <Link href={buildHref(totalPages)} className={btnBase} style={normal}>{totalPages}</Link>
        </>
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className={btnBase}
          style={normal}
          aria-label="Page suivante"
        >
          ›
        </Link>
      ) : (
        <span
          className={`${btnBase} opacity-30 cursor-not-allowed`}
          style={normal}
          aria-disabled="true"
        >
          ›
        </span>
      )}
    </nav>
  )
}
