import { Link } from 'react-router-dom'
import type { Portfolio, SectionHead } from '../lib/types'
import { coverOf } from '../hooks/useSiteData'
import Reveal from './Reveal'

/** 포트폴리오 카드 한 장 — 이미지가 주인공, 정보는 아래에 조용히 */
export function PortfolioCard({
  project,
  index,
  onOpen,
}: {
  project: Portfolio
  index: number
  onOpen: (p: Portfolio) => void
}) {
  const cover = coverOf(project)
  const count = project.images?.length ?? 0

  return (
    <Reveal delay={(index % 3) * 90}>
      <a
        className="p-card"
        href={`/work/${project.slug || project.id}`}
        onClick={(e) => {
          e.preventDefault()
          onOpen(project)
        }}
      >
        <div className="p-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="p-thumb">
          {cover && (
            <img
              src={cover.thumb_url || cover.image_url}
              alt={cover.alt || project.title}
              loading="lazy"
              decoding="async"
              width={cover.width ?? undefined}
              height={cover.height ?? undefined}
            />
          )}
          {count > 1 && <span className="p-count">{count} IMAGES</span>}
          <div className="p-hover-title">
            <span className="p-hover-name">{project.title}</span>
            {project.category && <span className="p-hover-cat">{project.category}</span>}
          </div>
        </div>
        <div className="p-meta-row">
          <div>
            <div className="p-title">{project.title}</div>
            <div className="p-cat">{project.category}</div>
          </div>
          {project.year && <div className="p-year">{project.year}</div>}
        </div>
      </a>
    </Reveal>
  )
}

export default function PortfolioSection({
  head,
  projects,
  onOpen,
  limit = 6,
}: {
  head: SectionHead
  projects: Portfolio[]
  onOpen: (p: Portfolio) => void
  limit?: number
}) {
  const residential: Portfolio[] = []
  const commercial: Portfolio[] = []
  const other: Portfolio[] = []

  for (const project of projects) {
    const category = project.category ?? ''
    if (/주거|residential|^home$/i.test(category) || project.id === 'sample-residential-concept') {
      residential.push(project)
    } else if (/상업|commercial/i.test(category)) {
      commercial.push(project)
    } else {
      other.push(project)
    }
  }

  const groups = [
    { title: '주거', items: residential },
    { title: '상업', items: commercial },
    ...(other.length ? [{ title: '기타', items: other }] : []),
  ]
  const heading = /^selected works$/i.test(head.heading.trim()) ? '프로젝트' : head.heading

  return (
    <section id="portfolio" className="divider">
      <div className="wrap">
        <div className="portfolio-head">
          <Reveal>
            <div className="eyebrow-plain">{head.eyebrow}</div>
            <h2 className="section-title">{heading}</h2>
          </Reveal>
          <Link to="/work" className="link-underline">포트폴리오 전체 보기</Link>
        </div>

        {groups.map(({ title, items }) => (
          <div key={title} style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>
              {title === '기타' ? title : (
                <Link to={title === '주거' ? '/work?category=residential' : '/work?category=commercial'}>
                  {title === '주거' ? 'RESIDENTIAL' : 'COMMERCIAL'}
                </Link>
              )}
            </h3>
            {items.length ? (
              <div className="portfolio-grid">
                {items.slice(0, limit).map((project, index) => (
                  <PortfolioCard key={project.id} project={project} index={index} onOpen={onOpen} />
                ))}
              </div>
            ) : (
              <div className="portfolio-empty">등록된 {title} 프로젝트가 없습니다.</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
