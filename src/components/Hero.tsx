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
  const messages = [
  {
    "titleTop": "From thought,",
    "titleBottom": "to space.",
    "subtitle": "당신의 생각에서 시작되는 공간.\n막연한 상상을 함께 다듬어, 완성될 공간을 선명하게 보여드립니다."
  },
  {
    "titleTop": "See it,",
    "titleBottom": "before it’s built.",
    "subtitle": "선택하기 전에, 먼저 만나보세요.\n가구의 배치부터 소재와 빛의 조화까지, 미리 확인하고 더 자신 있게 선택하세요."
  },
  {
    "titleTop": "Detail,",
    "titleBottom": "makes the whole.",
    "subtitle": "보이지 않는 곳까지 헤아리는 디테일이 브랜드와 공간의 완성도를 만듭니다."
  },
  {
    "titleTop": "Your vision,",
    "titleBottom": "clearly expressed.",
    "subtitle": "좋은 제안에는, 선명한 이미지가 필요합니다.\n말과 도면으로 전하기 어려웠던 생각을, 공간의 의도가 전달되는 이미지로 완성합니다."
  },
  {
    "titleTop": "A space to see,",
    "titleBottom": "a reason to believe.",
    "subtitle": "나에게는 확신을, 누군가에게는 설득을.\n당신의 아이디어를 구체적인 공간으로 그려, 다음 결정을 돕습니다."
  }
]
  const slides = [
    '/images/01-arched-living.png',
    '/images/02-city-apartment.png',
    '/images/03-dining-courtyard.png',
    '/images/04-modern-kitchen.png',
    '/images/05-bedroom-retreat.png',
  ].map((image, index) => ({
    image,
    eyebrow: hero.eyebrow,
    ...messages[index],
  }))
  const [active, setActive] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [active, slides.length])

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
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const element = subtitleRef.current
    if (!element) return
    const fit = () => {
      const baseSize = Number.parseFloat(getComputedStyle(element).getPropertyValue('--body-size')) || 16
      element.style.fontSize = baseSize + 'px'
      const widest = Math.max(...Array.from(element.children).map((line) => line.scrollWidth))
      if (widest > element.clientWidth) element.style.fontSize = (baseSize * element.clientWidth / widest) + 'px'
    }
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    fit()
    return () => observer.disconnect()
  }, [active])

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
        <div className="hero-specialties">3D VISUALIZATION · INTERIOR · ARCHITECTURE · EXHIBITION · COMMERCIAL</div>
        <h1 key={`h1-${active}`}>
          {slide.titleTop}
          <br />
          {slide.titleBottom}
        </h1>
        <p className="hero-sub" ref={subtitleRef} style={{ maxWidth: 'min(100%, 620px)' }} key={`sub-${active}`}>
          {slide.subtitle.split('\n').map((line) => (
            <span key={line} style={{ display: 'block', whiteSpace: 'nowrap' }}>{line}</span>
          ))}
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
