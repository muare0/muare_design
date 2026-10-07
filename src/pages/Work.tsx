import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { PortfolioCard } from '../components/PortfolioSection'
import ProjectView from '../components/ProjectView'
import Reveal from '../components/Reveal'
import { useSiteContent, usePortfolios } from '../hooks/useSiteData'
import { PLACEHOLDER_PORTFOLIOS } from '../content/defaults'
import type { Portfolio } from '../lib/types'

/** 전체 포트폴리오 아카이브 — 카테고리별로 걸러볼 수 있습니다 */
export default function Work() {
  const { content } = useSiteContent()
  const { portfolios, loading } = usePortfolios()
  const [filter, setFilter] = useState<string>('ALL')
  const [openProject, setOpenProject] = useState<Portfolio | null>(null)
  const [page, setPage] = useState(1)

  /** 한 페이지에 보여줄 개수 — 3열 그리드 기준 3줄(9개)이 보기 좋습니다 */
  const PAGE_SIZE = 9

  const list = portfolios.length > 0 ? portfolios : loading ? [] : PLACEHOLDER_PORTFOLIOS

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of list) if (p.category) set.add(p.category)
    return ['ALL', ...Array.from(set)]
  }, [list])

  const filtered = filter === 'ALL' ? list : list.filter((p) => p.category === filter)

  useEffect(() => {
    setPage(1)
  }, [filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goToPage(n: number) {
    setPage(n)
    document.getElementById('archive-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openIdx = openProject ? filtered.findIndex((p) => p.id === openProject.id) : -1
  const next = openIdx >= 0 ? filtered[(openIdx + 1) % filtered.length] : null

  return (
    <>
      <Header site={content.site} />

      <div className="wrap archive-head">
        <Reveal>
          <div className="eyebrow-plain">{content.portfolio.eyebrow}</div>
          <h2 className="section-title">{content.portfolio.heading}</h2>
          {categories.length > 2 && (
            <div className="archive-filters">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`filter-chip${filter === c ? ' active' : ''}`}
                  onClick={() => setFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <div id="archive-grid" className="wrap" style={{ paddingBottom: 120, scrollMarginTop: 100 }}>
        {filtered.length === 0 ? (
          <div className="portfolio-empty">등록된 프로젝트가 없습니다.</div>
        ) : (
          <>
            <div className="portfolio-grid">
              {paged.map((p, i) => (
                <PortfolioCard
                  key={p.id}
                  project={p}
                  index={(page - 1) * PAGE_SIZE + i}
                  onOpen={(proj) => {
                    if (!proj.id.startsWith('placeholder-')) setOpenProject(proj)
                  }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="page-arrow"
                  disabled={page === 1}
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  aria-label="이전 페이지"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`page-num${n === page ? ' active' : ''}`}
                    onClick={() => goToPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="page-arrow"
                  disabled={page === totalPages}
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  aria-label="다음 페이지"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer site={content.site} contact={content.contact} />

      {openProject && (
        <ProjectView
          project={openProject}
          nextProject={next && next.id !== openProject.id ? next : null}
          onClose={() => setOpenProject(null)}
          onNavigate={setOpenProject}
        />
      )}
    </>
  )
}
