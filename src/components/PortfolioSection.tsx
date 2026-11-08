import { useRef, useState } from 'react'
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
  const category = project.category ?? ''
  const categoryLabels: Record<string, string> = {
    School: '학교', Academy: '학원', 'Public & Civic': '공공 · 관공서',
    'Pilates & Fitness': '운동 · 필라테스', Exhibition: '전시 · 팝업', Culture: '문화 공간',
    'Restaurant & Bar': '식음 공간', 'Café & Bakery': '카페 · 베이커리',
    'Retail & Showroom': '매장 · 쇼룸', Office: '오피스', Clinic: '의료',
    'Beauty & Spa': '뷰티 · 스파', Hospitality: '숙박',
  }
  const label = categoryLabels[category] || (/주거|residential|^home$/i.test(category)
    ? 'RESIDENTIAL'
    : /상업|commercial/i.test(category) ? 'COMMERCIAL' : category)

  return (
    <Reveal delay={(index % 3) * 90}>
      <a
        className="p-card"
        aria-label={project.title}
        href={`/work/${project.slug || project.id}`}
        onClick={(e) => {
          e.preventDefault()
          onOpen(project)
        }}
      >
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
          <div className="p-hover-title" aria-hidden="true">
            <span className="p-hover-name">{project.title}</span>
            {label && <span className="p-hover-cat">{label}{project.id.startsWith('sample-') ? ' · 임시 예시' : ''}</span>}
          </div>
        </div>
      </a>
    </Reveal>
  )
}

export function PortfolioGallery({ projects, onOpen, startIndex = 0 }: {
  projects: Portfolio[]
  onOpen: (project: Portfolio) => void
  startIndex?: number
}) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  return (
    <div className="portfolio-gallery-frame">
      <style>{`
.portfolio-dots { display: none; }
@media (max-width: 560px) {
  .portfolio-gallery-frame { position: relative; }
  .portfolio-grid.portfolio-gallery { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 100%; gap: 0; overflow-x: auto; overflow-y: hidden; touch-action: pan-x pinch-zoom; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .portfolio-gallery::-webkit-scrollbar { display: none; }
  .portfolio-gallery > * { min-width: 0; scroll-snap-align: start; }
  .portfolio-dots { display: flex; justify-content: center; flex-wrap: wrap; position: absolute; inset-inline: 0; bottom: 8px; z-index: 4; color: #fff; pointer-events: none; }
  .portfolio-dots button { width: 30px; height: 32px; display: grid; place-items: center; padding: 0; border: 0; background: transparent; cursor: pointer; color: inherit; pointer-events: auto; }
  .portfolio-dots button::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .35; }
  .portfolio-dots button[aria-current='true']::before { opacity: .9; }
}
`}</style>
      <div className="portfolio-grid portfolio-gallery" ref={track} onScroll={(event) => {
        const { scrollLeft, clientWidth } = event.currentTarget
        if (clientWidth) setActive(Math.min(projects.length - 1, Math.max(0, Math.round(scrollLeft / clientWidth))))
      }}>
        {projects.map((project, index) => (
          <PortfolioCard key={project.id} project={project} index={startIndex + index} onOpen={onOpen} />
        ))}
      </div>
      {projects.length > 1 && (
        <div className="portfolio-dots" role="group" aria-label="포트폴리오 사진 선택">
          {projects.map((project, index) => (
            <button key={project.id} type="button" aria-label={`${index + 1}번 사진`}
              aria-current={active === index ? 'true' : undefined}
              onClick={() => {
                const gallery = track.current
                if (gallery) gallery.scrollTo({ left: index * gallery.clientWidth, behavior: 'auto' })
              }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PortfolioSection({
  head,
  projects,
  onOpen,
  limit = 4,
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
    } else if (category) {
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
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.8, color: 'var(--text-soft)' }}>뮤아르와 함께 그려낸 공간들을 만나보세요.</p>
          </Reveal>
          <Link to="/work" className="link-underline">포트폴리오 전체 보기</Link>
        </div>

        {groups.map(({ title, items }, groupIndex) => (
          <div key={title} style={{ marginTop: groupIndex === 0 ? 32 : 'clamp(56px, 6vw, 88px)' }}>
            <h3 style={{ marginBottom: 16 }}>
              {title === '기타' ? title : (
                <Link to={title === '주거' ? '/work?category=residential' : '/work?category=commercial'}>
                  {title === '주거' ? 'RESIDENTIAL' : 'COMMERCIAL'}
                </Link>
              )}
            </h3>
            {items.length ? (
              <PortfolioGallery projects={items.slice(0, limit)} onOpen={onOpen} />
            ) : (
              <div className="portfolio-empty">등록된 {title} 프로젝트가 없습니다.</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
