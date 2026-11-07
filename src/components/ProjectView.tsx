import { Fragment, useEffect, useRef, useState } from 'react'
import type { Portfolio } from '../lib/types'
import Lightbox from './Lightbox'

/**
 * 프로젝트 상세 — 매거진 지면처럼 읽히도록 구성했습니다.
 *  · 제목 / 설명 / 사실관계(카테고리·연도·클라이언트·역할)
 *  · 이미지는 비율을 그대로 살리고, 폭을 번갈아 주어 리듬을 만듭니다
 *  · 이미지를 클릭하면 라이트박스로 확대
 */

/** 이미지 비율에 따라 지면에서의 폭을 결정 (세로 사진은 좁게, 가로는 넓게) */
function widthClass(w: number | null, h: number | null, i: number): string {
  if (!w || !h) return i % 3 === 0 ? 'wide' : 'regular'
  const ratio = w / h
  if (ratio < 0.85) return 'narrow' // 세로가 긴 이미지
  if (ratio > 1.7) return 'wide' // 파노라마에 가까운 이미지
  return i % 3 === 0 ? 'wide' : 'regular'
}

function GalleryImage({
  src,
  alt,
  width,
  height,
  className,
  onClick,
  priority,
}: {
  src: string
  alt: string
  width: number | null
  height: number | null
  className: string
  onClick: () => void
  priority: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <figure className={`gal-figure ${className}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        width={width ?? undefined}
        height={height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // 비율을 미리 잡아두어 로딩 중 레이아웃이 흔들리지 않게 합니다
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        className={loaded ? undefined : 'loading'}
        onLoad={() => setLoaded(true)}
      />
    </figure>
  )
}

export default function ProjectView({
  project,
  nextProject,
  onClose,
  onNavigate,
}: {
  project: Portfolio
  nextProject?: Portfolio | null
  onClose: () => void
  onNavigate?: (p: Portfolio) => void
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [barScrolled, setBarScrolled] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sourceImages = project.images ?? []
  const roomGroups = project.slug === 'gwonseon-xi' ? [
    { title: 'LIVING ROOM / 거실', note: '밝은 벽과 우드 바닥에 간접조명을 더해 편안한 분위기로 구성한 거실입니다.', indices: [4, 5] },
    { title: 'KITCHEN / 주방', note: 'ㄷ자형 배치로 조리공간을 확보하고, 밝은 톤의 수납장과 유리 장식장으로 구성한 주방입니다.', indices: [7, 8] },
    { title: 'ENTRANCE / 현관', note: '벽면 수납과 간접조명으로 정돈된 인상을 주는 현관입니다.', indices: [1] },
    { title: 'MASTER BEDROOM / 안방', note: '우드 바닥과 밝은 붙박이장으로 통일감을 준 안방입니다.', indices: [6] },
    { title: 'ROOM / 방', note: '발코니와 연결된 창을 중심으로 밝고 간결하게 구성한 방입니다.', indices: [9] },
    { title: 'BATHROOM / 욕실', note: '그레이 타일과 어두운 하부장, 조명 거울로 구성한 욕실입니다.', indices: [0, 2, 3, 10, 11] },
  ] : project.slug === 'suwon-sk-skyview-35b' ? [
    { title: 'LIVING ROOM / 거실', note: '밝은 톤의 마감과 큰 창으로 개방감을 살린 거실입니다.', indices: [0, 1] },
    { title: 'KITCHEN / 주방', note: '거실과 이어지는 대면형 주방에 수납장과 우드 포인트를 더했습니다.', indices: [2, 3] },
    { title: 'MASTER BEDROOM / 안방', note: '밝은 붙박이장과 자연광으로 차분하게 구성한 안방입니다.', indices: [4] },
    { title: 'BATHROOM / 공용욕실', note: '그레이 타일과 조명 거울로 구성한 공용욕실입니다.', indices: [6] },
    { title: 'MASTER BATHROOM / 안방욕실', note: '밝은 타일과 우드 수납장으로 따뜻한 분위기를 더한 안방욕실입니다.', indices: [7] },
  ] : project.slug === 'gwanggyo-hoban-gardenheim' ? [
    { title: '01. LIVING ROOM / 거실', note: '넓은 창과 밝은 타일에 우드 포인트와 간접조명을 더한 거실입니다.', indices: [0, 1] },
    { title: '02. KITCHEN / 주방', note: '대면형 아일랜드와 벽면 수납을 배치하고, 밝은 마감에 우드 소재를 더했습니다.', indices: [2, 3, 4] },
    { title: '03. ENTRANCE / 현관', note: '벽면 수납에 우드 선반과 거울을 더하고 유리 중문으로 실내와 연결했습니다.', indices: [5, 6] },
    { title: '04. STORAGE / 수납 공간', note: '벽면 붙박이장에 우드 오픈 선반과 아치형 입구를 조합했습니다.', indices: [7, 8, 9] },
    { title: '05. BEDROOM / 침실', note: '우드 프레임 유리문과 수납형 침대, 붙박이 선반으로 구성한 침실입니다.', indices: [10, 11] },
    { title: '06. ROOM / 방', note: '밝은 마감으로 자연광을 살리고 실링팬을 더했습니다.', indices: [12] },
    { title: '07. BATHROOM / 공용욕실', note: '그레이 타일과 우드 수납장을 조합하고 유리 파티션으로 샤워 공간을 나눴습니다.', indices: [13] },
    { title: '08. MASTER BATHROOM / 안방욕실', note: '우드 하부장과 넓은 거울, 유리 샤워 부스를 배치한 욕실입니다.', indices: [14] },
    { title: '09. LAUNDRY / 세탁실', note: '세탁기와 건조기, 세탁볼과 수납을 한쪽 벽면에 모았습니다.', indices: [15] },
  ] : []
  const gallery = roomGroups.length ? roomGroups.flatMap((group) =>
    group.indices.flatMap((index, position) => sourceImages[index] ? [{
      image: sourceImages[index], title: position === 0 ? group.title : '',
      note: position === 0 ? group.note : '',
    }] : []),
  ) : sourceImages.map((image) => ({ image, title: '', note: '' }))
  const images = gallery.map(({ image }) => image)

  /* 배경(홈) 스크롤 잠금 + 상세는 항상 맨 위에서 시작 */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    scrollerRef.current?.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = prev
    }
  }, [project.id])

  /* ESC 로 상세 닫기 (라이트박스가 열려 있을 땐 라이트박스가 먼저 처리) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxIndex === null) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, lightboxIndex])

  const facts = [
    { label: 'CATEGORY', value: project.category },
    { label: 'YEAR', value: project.year },
    { label: 'CLIENT', value: project.slug === 'gwanggyo-hoban-gardenheim' ? undefined : project.client },
    { label: 'ROLE', value: project.role },
  ].filter((f) => f.value)

  return (
    <div
      className="project-view"
      ref={scrollerRef}
      onScroll={(e) => setBarScrolled(e.currentTarget.scrollTop > 10)}
    >
      <div className={`project-bar${barScrolled ? ' scrolled' : ''}`}>
        <div className="wrap project-bar-row">
          <button className="project-back" onClick={onClose}>
            <span className="arrow">←</span> BACK
          </button>
          <div className="project-bar-title">{project.title}</div>
        </div>
      </div>

      <div className="wrap project-head">
        <div className="project-index">
          {String((project.sort_order ?? 0) + 1).padStart(2, '0')}
          {project.title_en ? ` — ${project.title_en}` : ''}
        </div>
        <h1 className="project-title" style={project.slug === 'gwonseon-xi' ? { whiteSpace: 'nowrap', maxWidth: 'none', fontSize: 'clamp(20px, 4.8vw, 38px)' } : project.slug === 'gwanggyo-hoban-gardenheim' ? { whiteSpace: 'nowrap', maxWidth: 'none', fontSize: 'clamp(15px, 4.5vw, 38px)' } : undefined}>{project.title}</h1>
        {project.description && <p className="project-lede">{project.description}</p>}

        {facts.length > 0 && (
          <div className="project-facts">
            {facts.map((f) => (
              <div key={f.label}>
                <div className="fact-label">{f.label}</div>
                <div className="fact-value">{f.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wrap project-gallery">
        {images.length === 0 ? (
          <p className="portfolio-empty">이 프로젝트에는 아직 이미지가 없습니다.</p>
        ) : (
          gallery.map(({ image: img, title, note }, i) => (
            <Fragment key={img.id}>
              {title && (
                <div style={{ margin: '56px 0 24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 500 }}>{title}</h2>
                  <p style={{ marginTop: 12, color: 'var(--text-soft)', fontSize: 14 }}>{note}</p>
                </div>
              )}
            <GalleryImage
              src={img.image_url}
              alt={img.alt || `${project.title} ${i + 1}`}
              width={img.width}
              height={img.height}
              className={widthClass(img.width, img.height, i)}
              priority={i < 2}
              onClick={() => setLightboxIndex(i)}
            />
            </Fragment>
          ))
        )}
      </div>

      <div className="wrap project-foot">
        <button className="project-back" onClick={onClose}>
          <span className="arrow">←</span> ALL PROJECTS
        </button>
        {nextProject && onNavigate && (
          <button className="project-next" onClick={() => onNavigate(nextProject)}>
            <span className="label">NEXT PROJECT</span>
            <span className="name">{nextProject.title}</span>
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          projectTitle={project.title}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
