import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { PortfolioGallery } from '../components/PortfolioSection'
import ProjectView from '../components/ProjectView'
import Reveal from '../components/Reveal'
import { useSiteContent, usePortfolios } from '../hooks/useSiteData'
import type { Portfolio } from '../lib/types'

export const sampleProjects: Portfolio[] = []

const commercialGroups = [
  { key: 'education', label: '학교 · 공공 · 학원', match: /school|academy|public|civic|학교|학원|공공|관공서/i },
  { key: 'fitness', label: '운동 · 필라테스', match: /pilates|fitness|필라테스|운동/i },
  { key: 'exhibition', label: '전시 · 팝업', match: /exhibition|culture|전시|팝업/i },
  { key: 'food', label: '식음 공간', match: /restaurant|bar|caf[eé]|bakery|식음|음식점|카페/i },
  { key: 'retail', label: '매장 · 쇼룸', match: /retail|showroom|매장|쇼룸/i },
  { key: 'office', label: '오피스', match: /office|오피스|사무/i },
  { key: 'wellness', label: '의료 · 뷰티', match: /clinic|beauty|spa|의료|뷰티/i },
  { key: 'hospitality', label: '숙박', match: /hospitality|숙박/i },
]

/** 전체 포트폴리오 아카이브 — 카테고리별로 걸러볼 수 있습니다 */
export default function Work() {
  const { content } = useSiteContent()
  const { portfolios, loading } = usePortfolios()
  const [params] = useSearchParams()
  const filter = params.get('category') === 'commercial' ? 'commercial' : 'residential'
  const [openProject, setOpenProject] = useState<Portfolio | null>(null)
  const [page, setPage] = useState(1)

  /** 한 페이지에 보여줄 개수 — 3열 그리드 기준 3줄(9개)이 보기 좋습니다 */
  const PAGE_SIZE = 9

  const categories = [
    { key: 'residential', label: 'RESIDENTIAL', match: /주거|residential|^home$/i },
    { key: 'commercial', label: 'COMMERCIAL', match: /상업|commercial/i },
  ]
  const active = categories.find(({ key }) => key === filter)!
  const isResidential = (category: string | null) => /주거|residential|^home$/i.test(category ?? '')
  const commercial = portfolios.filter((p) => p.category && !isResidential(p.category))
  const availableGroups = commercialGroups.filter((group) => commercial.some((p) => group.match.test(p.category ?? '')))
  const selectedGroup = availableGroups.find((group) => group.key === params.get('type'))
  const base = filter === 'residential' ? portfolios.filter((p) => isResidential(p.category)) : commercial
  const filtered = loading ? [] : base.filter((p) => filter !== 'commercial' || !selectedGroup || selectedGroup.match.test(p.category ?? ''))

  useEffect(() => {
    setPage(1)
  }, [filter, params.get('type')])

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
          <div style={{ textAlign: 'center' }}>
            <h1 className="section-title">{active.label}</h1>
            <p>{filter === 'residential' ? '뮤아르가 제안하는 주거 공간을 만나보세요.' : '뮤아르가 제안하는 상업 공간을 만나보세요.'}</p>
            <nav className="archive-filters" aria-label="프로젝트 유형" style={{ justifyContent: 'center' }}>
              {categories.map(({ key, label }) => (
                <Link
                  key={key}
                  to={`/work?category=${key}`}
                  className={`filter-chip${filter === key ? ' active' : ''}`}
                  aria-current={filter === key ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            {filter === 'commercial' && availableGroups.length > 0 && (
              <nav className="archive-filters" aria-label="상업 공간 세부 분류" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                <Link to="/work?category=commercial" className={'filter-chip' + (!selectedGroup ? ' active' : '')} aria-current={!selectedGroup ? 'page' : undefined}>전체 ({commercial.length})</Link>
                {availableGroups.map((group) => (
                  <Link key={group.key} to={'/work?category=commercial&type=' + group.key} className={'filter-chip' + (selectedGroup?.key === group.key ? ' active' : '')} aria-current={selectedGroup?.key === group.key ? 'page' : undefined}>
                    {group.label} ({commercial.filter((p) => group.match.test(p.category ?? '')).length})
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </Reveal>
      </div>

      <div id="archive-grid" className="wrap" style={{ paddingBottom: 120, scrollMarginTop: 100 }}>
        {filtered.length === 0 ? (
          <div className="portfolio-empty">{loading ? '프로젝트를 불러오는 중입니다.' : '등록된 프로젝트가 없습니다.'}</div>
        ) : (
          <>
            <PortfolioGallery
              key={`${filter}-${page}`}
              projects={paged}
              startIndex={(page - 1) * PAGE_SIZE}
              onOpen={(project) => {
                if (!project.id.startsWith('placeholder-')) setOpenProject(project)
              }}
            />

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
