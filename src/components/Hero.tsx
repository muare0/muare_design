import { useEffect, useRef, useState } from 'react'
import type { HeroContent } from '../lib/types'

/**
 * 좌/우 클릭(큰 영역), 좌우 드래그(스와이프)로 배경이 카드 넘기듯 전환되는 히어로.
 * 페이지 스크롤 위치와는 완전히 분리되어 있어서(= scrollTo 를 호출하지 않음),
 * 클릭할 때 화면이 살짝 밀리는 문제가 구조적으로 발생하지 않습니다.
 *
 * 휠 스크롤은 일부러 가로채지 않습니다 — 히어로 위에서 마우스 휠을 굴리면
 * 평소처럼 페이지가 그대로 아래/위로 스크롤됩니다.
 */
export default function Hero({ hero }: { hero: HeroContent }) {
  const slides = [
    {
      image: hero.image,
      eyebrow: hero.eyebrow,
      titleTop: hero.titleTop,
      titleBottom: hero.titleBottom,
      subtitle: hero.subtitle,
    },
    {
      image: '/images/back2-clean.png',
      eyebrow: hero.eyebrow2 || hero.eyebrow,
      titleTop: hero.titleTop2 || hero.titleTop,
      titleBottom: hero.titleBottom2 || hero.titleBottom,
      subtitle: hero.subtitle2 || hero.subtitle,
    },
  ]
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const heroRef = useRef<HTMLElement>(null)
  // 전환 애니메이션이 끝나기 전에 다음 전환이 겹쳐 들어오지 않도록 막는 잠금
  const lockRef = useRef(false)
  const lockTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => () => window.clearTimeout(lockTimer.current), [])

  function goTo(i: number) {
    const next = Math.max(0, Math.min(slides.length - 1, i))
    if (next === activeRef.current || lockRef.current) return
    lockRef.current = true
    setActive(next)
    window.clearTimeout(lockTimer.current)
    lockTimer.current = window.setTimeout(() => {
      lockRef.current = false
    }, 820)
  }

  // 좌우 드래그(마우스 클릭+드래그 또는 터치 스와이프)로도 슬라이드가 넘어갑니다
  const dragX = useRef<number | null>(null)
  const draggedRef = useRef(false)
  function onPointerDown(e: React.PointerEvent) {
    dragX.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragX.current == null) return
    const delta = e.clientX - dragX.current
    dragX.current = null
    if (Math.abs(delta) < 40) return
    draggedRef.current = true
    goTo(activeRef.current + (delta < 0 ? 1 : -1))
  }

  // 좌/우 클릭 영역 — 드래그 직후에 이어서 발생하는 click 은 무시해 이중 전환을 막습니다
  function handleZoneClick(dir: 1 | -1) {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    goTo(activeRef.current + dir)
  }

  const slide = slides[active]

  return (
    <section className="hero" id="top" ref={heroRef} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <div className="hero-bg-stack">
        <div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {slides.map((s, i) => (
            <div
              key={s.image + i}
              className="hero-slide"
              style={{ backgroundImage: `url('${s.image}')` }}
            />
          ))}
        </div>
        <div className="hero-gradient" />
      </div>

      <div className="wrap hero-inner">
        <div className="hero-eyebrow" key={`eb-${active}`}>
          {slide.eyebrow}
        </div>
        <h1 key={`h1-${active}`}>
          {slide.titleTop}
          <br />
          {slide.titleBottom}
        </h1>
        <p className="hero-sub" key={`sub-${active}`}>
          {slide.subtitle}
        </p>
      </div>

      {slides.length > 1 && (
        <div className="hero-zones" aria-hidden="true">
          <button
            type="button"
            className="hero-zone hero-zone-prev"
            aria-label="이전 화면"
            tabIndex={-1}
            onClick={() => handleZoneClick(-1)}
          />
          <button
            type="button"
            className="hero-zone hero-zone-next"
            aria-label="다음 화면"
            tabIndex={-1}
            onClick={() => handleZoneClick(1)}
          />
        </div>
      )}

      {slides.length > 1 && (
        <div className="hero-indicator">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`슬라이드 ${i + 1}`}
              className={`hero-dot${i === active ? ' active' : ''}`}
              onClick={() => goTo(i)}
            >
              <span className="hero-dot-mark" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
