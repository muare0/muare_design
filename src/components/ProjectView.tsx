import { useEffect, useRef, useState } from 'react'
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
  const images = project.images ?? []

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
    { label: 'CLIENT', value: project.client },
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
        <h1 className="project-title">{project.title}</h1>
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
          images.map((img, i) => (
            <GalleryImage
              key={img.id}
              src={img.image_url}
              alt={img.alt || `${project.title} ${i + 1}`}
              width={img.width}
              height={img.height}
              className={widthClass(img.width, img.height, i)}
              priority={i < 2}
              onClick={() => setLightboxIndex(i)}
            />
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
