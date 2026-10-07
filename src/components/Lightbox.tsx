import { useCallback, useEffect, useRef, useState } from 'react'
import type { PortfolioImage } from '../lib/types'

/**
 * 작품 감상용 라이트박스.
 *  · 좌우 방향키 / 이전·다음 버튼 / 모바일 스와이프
 *  · 클릭하면 확대(zoom), 다시 클릭하면 원래대로
 *  · ESC 또는 배경 클릭으로 닫기
 *  · 우측 상단에 '현재/전체' 개수 표시
 * UI 는 작품을 가리지 않도록 최소한으로만 배치했습니다.
 */
export default function Lightbox({
  images,
  index,
  projectTitle,
  onIndexChange,
  onClose,
}: {
  images: PortfolioImage[]
  index: number
  projectTitle: string
  onIndexChange: (i: number) => void
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  const [dragX, setDragX] = useState(0)
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const lockRef = useRef<'none' | 'x' | 'y'>('none')

  const current = images[index]
  const canPrev = index > 0
  const canNext = index < images.length - 1

  const go = useCallback(
    (dir: -1 | 1) => {
      const next = index + dir
      if (next < 0 || next >= images.length) return
      setZoomed(false)
      onIndexChange(next)
    },
    [index, images.length, onIndexChange],
  )

  /* 키보드 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomed) setZoomed(false)
        else onClose()
      } else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose, zoomed])

  /* 배경 스크롤 잠금 */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  /* 다음/이전 이미지 미리 불러오기 — 넘길 때 끊김 없이 */
  useEffect(() => {
    for (const i of [index + 1, index - 1]) {
      const img = images[i]
      if (img) {
        const pre = new Image()
        pre.src = img.image_url
      }
    }
  }, [index, images])

  /* 모바일 스와이프 */
  function onPointerDown(e: React.PointerEvent) {
    if (zoomed) return
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    lockRef.current = 'none'
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = startRef.current
    if (!s || zoomed) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (lockRef.current === 'none') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
    }
    if (lockRef.current === 'x') {
      // 끝에서는 저항감을 주어 끝이라는 걸 느끼게 함
      const resist = (dx < 0 && !canNext) || (dx > 0 && !canPrev) ? 0.28 : 1
      setDragX(dx * resist)
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    const s = startRef.current
    startRef.current = null
    if (!s || zoomed) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    const dt = Date.now() - s.t
    setDragX(0)

    if (lockRef.current === 'x') {
      const fast = dt < 300 && Math.abs(dx) > 40
      if ((fast || dx < -70) && dx < 0 && canNext) go(1)
      else if ((fast || dx > 70) && dx > 0 && canPrev) go(-1)
      return
    }
    // 아래로 크게 끌면 닫기 (모바일에서 자연스러운 동작)
    if (lockRef.current === 'y' && dy > 110) onClose()
  }

  if (!current) return null

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${projectTitle} 이미지 ${index + 1} / ${images.length}`}
      onClick={(e) => {
        // 배경(이미지 바깥) 클릭 시 닫기
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="lb-top">
        <span className="lb-counter">
          {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </span>
        <button className="lb-close" onClick={onClose} aria-label="닫기">
          CLOSE ✕
        </button>
      </div>

      <div
        className="lb-stage"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startRef.current = null
          setDragX(0)
        }}
      >
        <img
          key={current.id}
          className={`lb-img ${zoomed ? 'zoomed' : 'fit'}`}
          src={current.image_url}
          alt={current.alt || `${projectTitle} ${index + 1}`}
          draggable={false}
          style={{
            transform: zoomed
              ? 'scale(1.9)'
              : `translateX(${dragX}px)`,
            transition: dragX !== 0 ? 'none' : undefined,
            maxWidth: zoomed ? 'none' : undefined,
            maxHeight: zoomed ? 'none' : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation()
            setZoomed((z) => !z)
          }}
        />
      </div>

      <button
        className="lb-nav lb-prev"
        onClick={() => go(-1)}
        disabled={!canPrev}
        aria-label="이전 이미지"
      >
        ←
      </button>
      <button
        className="lb-nav lb-next"
        onClick={() => go(1)}
        disabled={!canNext}
        aria-label="다음 이미지"
      >
        →
      </button>

      <div className="lb-caption">
        {current.caption || projectTitle}
        {images.length > 1 && (
          <div className="lb-dots">
            {images.map((img, i) => (
              <button
                key={img.id}
                className={`lb-dot${i === index ? ' active' : ''}`}
                aria-label={`${i + 1}번째 이미지로 이동`}
                onClick={(e) => {
                  e.stopPropagation()
                  setZoomed(false)
                  onIndexChange(i)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
