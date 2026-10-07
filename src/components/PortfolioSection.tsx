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
  const shown = projects.slice(0, limit)

  return (
    <section id="portfolio" className="divider">
      <div className="wrap">
        <div className="portfolio-head">
          <Reveal>
            <div className="eyebrow-plain">{head.eyebrow}</div>
            <h2 className="section-title">{head.heading}</h2>
          </Reveal>
          {projects.length > limit && (
            <Link to="/work" className="link-underline">
              전체 보기
            </Link>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="portfolio-empty">
            아직 등록된 프로젝트가 없습니다. 관리자 페이지에서 첫 작품을 추가해 주세요.
          </div>
        ) : (
          <div className="portfolio-grid">
            {shown.map((p, i) => (
              <PortfolioCard key={p.id} project={p} index={i} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
