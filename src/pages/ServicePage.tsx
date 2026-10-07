import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import FloralMark from '../components/FloralMark'
import RatingBadge from '../components/RatingBadge'
import { GuideIcon } from '../components/SvcIcons'
import { useSiteContent } from '../hooks/useSiteData'
import {
  STRENGTHS,
  SCOPE,
  VISUAL_STEPS,
  CUSTOM,
  MATERIALS,
  PROCESS,
  REVISION,
  NOTICE,
  CLOSING,
} from '../content/serviceGuide'
import type { GuideHead } from '../content/serviceGuide'

/** 관리자 화면에서 값을 비워두면 쓸 기본 카카오 채널 주소 */
const KAKAO_FALLBACK_URL = 'https://pf.kakao.com/_AkFen'

/** 섹션 네비게이터가 가리키는 7개 섹션 id (순서대로) */
const JUMP_SECTION_IDS = [
  'svc-scope',
  'svc-visual',
  'svc-custom',
  'svc-materials',
  'svc-process',
  'svc-revision',
  'svc-notices',
]

/** 섹션 머리말 — 영문 라벨 / 한글 제목 / 한 줄 설명 */
function GuideHeading({ head }: { head: GuideHead }) {
  return (
    <Reveal className="guide-head">
      <div className="guide-en">{head.en}</div>
      <h2 className="guide-title">{head.title}</h2>
      <p className="guide-lead">{head.lead}</p>
    </Reveal>
  )
}

/** 아이콘 + 제목 + 번호가 붙은 카드 머리 */
function CardHead({ icon, title, no }: { icon?: string; title: string; no?: string }) {
  return (
    <div className="guide-card-head">
      <span className="guide-card-bar" aria-hidden="true" />
      {icon && (
        <span className="guide-card-icon">
          <GuideIcon name={icon} />
        </span>
      )}
      <h3>{title}</h3>
      {no && <span className="guide-card-no">{no}</span>}
    </div>
  )
}

/**
 * Service 페이지 (/service)
 * 작업범위 · 준비자료 · 제작과정 · 수정범위 · 안내사항을 한 페이지로 정리했습니다.
 * 문구는 src/content/serviceGuide.ts 에 모여 있습니다.
 *
 * "브랜드 소개(사진 + 소개글)"와 "서비스 대상"은 홈 화면에서만 보여줍니다.
 * (같은 내용이 두 화면에 반복되지 않도록)
 */
export default function ServicePage() {
  const { content } = useSiteContent()
  const info = content.serviceInfo
  const navigate = useNavigate()
  const jumpListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // 스크롤 중인 섹션을 감지해서 네비게이터의 해당 링크를 활성 표시하고,
  // 모바일에서 가로로 스크롤되는 링크 목록 안으로 자동으로 가운데 정렬해줍니다.
  // (좁은 화면에서 "지금 어디를 보고 있는지" 바로 알 수 있어 스크롤 방식만으로도
  //  헤매지 않고 쓸 수 있습니다)
  useEffect(() => {
    const listEl = jumpListRef.current
    if (!listEl) return
    const links = new Map<string, HTMLAnchorElement>()
    listEl.querySelectorAll('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href')?.slice(1)
      if (id) links.set(id, a as HTMLAnchorElement)
    })
    const sections = JUMP_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const link = links.get(entry.target.id)
          if (!link) return
          links.forEach((l) => l.classList.remove('active'))
          link.classList.add('active')
          // 목록 스크롤은 즉시 이동 — 페이지를 스크롤하는 동안 부드러운 애니메이션이
          // 겹쳐 산만해지지 않도록 했습니다.
          link.scrollIntoView({ inline: 'center', block: 'nearest' })
        })
      },
      { rootMargin: '-160px 0px -70% 0px', threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header site={content.site} />

      {/* 상위 메뉴(About/Service/Portfolio/Contact) 바로 아래, 화면에 고정된
          하위 섹션 네비게이터입니다. 스크롤해도 항상 같은 자리에 떠 있습니다. */}
      <nav className="svc-jumpnav" aria-label="서비스 섹션 바로가기">
        <div className="wrap svc-jumpnav-inner">
          <button type="button" className="svc-jumpnav-home" onClick={scrollTop}>
            Service
          </button>
          <span className="svc-jumpnav-sep" aria-hidden="true" />
          <div className="svc-jumpnav-list" ref={jumpListRef}>
            <a href="#svc-scope">SERVICE SCOPE</a>
            <a href="#svc-visual">BEFORE &amp; AFTER</a>
            <a href="#svc-custom">CUSTOM SERVICE</a>
            <a href="#svc-materials">PROJECT MATERIALS</a>
            <a href="#svc-process">WORK PROCESS</a>
            <a href="#svc-revision">REVISION GUIDE</a>
            <a href="#svc-notices">NOTICE &amp; POLICY</a>
          </div>
        </div>
      </nav>

      <button type="button" className="svc-back svc-back-fixed" onClick={goBack}>
        ← 이전 화면으로
      </button>

      {/* 서비스 개요 + 스튜디오 강점
          (브랜드 소개 사진·문구는 홈 화면에만 두고 여기서는 생략합니다) */}
      <section className="svc-section svc-section-first" id="svc-intro">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow-plain">{info.eyebrow}</div>
            <h1 className="svc-heading svc-plain-heading">{info.heading}</h1>
            {info.intro.map((p, i) => (
              <p className="svc-intro-p" key={i}>
                {p}
              </p>
            ))}
          </Reveal>

          <div className="str-row">
            {STRENGTHS.items.map((s, i) => (
              <Reveal className="str-card" key={s.key} delay={i * 70}>
                <div className="str-key">{s.key}</div>
                <h3 className="str-title">{s.title}</h3>
                <p className="str-desc">{s.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="str-banner" delay={120}>
            <RatingBadge score={STRENGTHS.rating.score} label={STRENGTHS.rating.label} />
            <div className="str-banner-copy">
              <div className="str-banner-label">{STRENGTHS.highlight.label}</div>
              <p>{STRENGTHS.highlight.text}</p>
              <span className="str-banner-note">{STRENGTHS.head.lead}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 작업 범위 */}
      <section className="divider svc-section" id="svc-scope">
        <div className="wrap">
          <GuideHeading head={SCOPE.head} />

          <div className="guide-grid-2">
            {SCOPE.groups.map((g, i) => (
              <Reveal className="guide-card" key={g.num} delay={i * 60}>
                <CardHead icon={g.icon} title={g.title} no={g.num} />
                <div className="guide-card-body">
                  <ul className="guide-items">
                    {g.items.map((it) => (
                      <li key={it.no}>
                        <div>
                          <span className="guide-item-no">{it.no}</span>
                          <span className="guide-item-name">{it.name}</span>
                        </div>
                        {it.desc && <p className="guide-item-desc">{it.desc}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}

            <Reveal className="guide-card" delay={180}>
              <CardHead icon={SCOPE.tools.icon} title={SCOPE.tools.title} no={SCOPE.tools.num} />
              <div className="guide-card-body">
                <div className="tool-grid">
                  {SCOPE.tools.items.map((t) => (
                    <div className="tool-cell" key={t.name}>
                      <span className="tool-cell-icon">
                        <GuideIcon name={t.icon} />
                      </span>
                      <span className="tool-cell-name">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="guide-panel" delay={120}>
            <h3 className="guide-panel-title">{SCOPE.flow.title}</h3>
            <p className="guide-panel-desc">{SCOPE.flow.desc}</p>
            <div className="guide-flow">
              {SCOPE.flow.steps.map((s, i) => (
                <div className="guide-flow-item" key={s.label}>
                  {i > 0 && (
                    <span className="guide-flow-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                  <div className="guide-flow-col">
                    <span className="guide-flow-badge">
                      <GuideIcon name={s.icon} />
                    </span>
                    <span className="guide-flow-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 시각화 단계 — BEFORE & AFTER */}
      <section className="divider svc-section" id="svc-visual">
        <div className="wrap">
          <GuideHeading head={VISUAL_STEPS.head} />
          <div className="vstep-row">
            {VISUAL_STEPS.steps.map((s, i) => (
              <Reveal className="vstep" key={s.no} delay={i * 80}>
                <span className="vstep-badge">
                  <GuideIcon name={s.icon} />
                </span>
                <div className="vstep-no">{s.no}</div>
                <h3 className="vstep-title">{s.title}</h3>
                <p className="vstep-desc">{s.desc}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="vstep-closing" delay={160}>
            {VISUAL_STEPS.closing}
          </Reveal>
        </div>
      </section>

      {/* 맞춤 모델링 */}
      <section className="divider svc-section" id="svc-custom">
        <div className="wrap">
          <GuideHeading head={CUSTOM.head} />
          <div className="custom-points">
            {CUSTOM.points.map((p, i) => (
              <Reveal className="custom-point" key={p.key} delay={i * 70}>
                <div className="custom-point-key">{p.key}</div>
                <div className="custom-point-title">{p.title}</div>
              </Reveal>
            ))}
          </div>
          <Reveal className="custom-band" delay={120}>
            <div className="custom-band-label">{CUSTOM.modeling.label}</div>
            <h3 className="custom-band-title">{CUSTOM.modeling.title}</h3>
            <p className="custom-band-desc">{CUSTOM.modeling.desc}</p>
            <div className="custom-band-note">
              <span className="guide-note-icon">
                <GuideIcon name="warn" />
              </span>
              {CUSTOM.modeling.note}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 작업 전 필요한 자료 */}
      <section className="divider svc-section" id="svc-materials">
        <div className="wrap">
          <GuideHeading head={MATERIALS.head} />
          <div className="mat-grid">
            <Reveal className="guide-card">
              <CardHead icon="clipboard" title={MATERIALS.checklistTitle} />
              <div className="guide-card-body">
                <ul className="guide-check">
                  {MATERIALS.checklist.map((m) => (
                    <li key={m}>
                      <span className="guide-check-mark">
                        <GuideIcon name="check" />
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <div className="mat-side">
              <Reveal className="guide-card" delay={80}>
                <CardHead icon="doc" title={MATERIALS.example.title} />
                <div className="guide-card-body">
                  <ul className="guide-bullets">
                    {MATERIALS.example.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal className="guide-card" delay={140}>
                <CardHead icon="ruler" title={MATERIALS.noDrawing.title} />
                <div className="guide-card-body">
                  <ul className="guide-check">
                    {MATERIALS.noDrawing.items.map((x) => (
                      <li key={x}>
                        <span className="guide-check-mark">
                          <GuideIcon name="check" />
                        </span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal className="guide-panel" delay={120}>
            <h3 className="guide-panel-title sm">{MATERIALS.flow.title}</h3>
            <div className="guide-flow">
              {MATERIALS.flow.steps.map((s, i) => (
                <div className="guide-flow-item" key={s.label}>
                  {i > 0 && (
                    <span className="guide-flow-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                  <div className="guide-flow-col">
                    <span className="guide-flow-badge">
                      <GuideIcon name={s.icon} />
                    </span>
                    <span className="guide-flow-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 제작 과정 */}
      <section className="divider svc-section" id="svc-process">
        <div className="wrap">
          <GuideHeading head={PROCESS.head} />
          <div className="proc-grid">
            {PROCESS.steps.map((s, i) => (
              <Reveal className={`proc-card${i % 2 === 1 ? ' alt' : ''}`} key={s.no} delay={i * 60}>
                <span className="proc-icon">
                  <GuideIcon name={s.icon} />
                </span>
                <div className="proc-no">{s.no}</div>
                <h3 className="proc-title">{s.title}</h3>
                <ul className="proc-lines">
                  {s.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal className="guide-card checkpoint-card" delay={120}>
            <CardHead title={PROCESS.checkpoints.title} />
            <div className="guide-card-body checkpoint-row">
              {PROCESS.checkpoints.items.map((c) => (
                <div className="checkpoint" key={c.title}>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 수정 범위 안내 */}
      <section className="divider svc-section" id="svc-revision">
        <div className="wrap">
          <GuideHeading head={REVISION.head} />
          <div className="guide-grid-2">
            <Reveal className="guide-card">
              <CardHead icon="check" title={REVISION.free.title} />
              <div className="guide-card-body">
                <p className="guide-card-intro">{REVISION.free.intro}</p>
                <ul className="guide-check tight">
                  {REVISION.free.items.map((x) => (
                    <li key={x}>
                      <span className="guide-check-mark">
                        <GuideIcon name="check" />
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="rev-callout">
                  <span className="rev-callout-icon">
                    <GuideIcon name="check" />
                  </span>
                  <div>
                    <strong>{REVISION.free.callout.title}</strong>
                    <p>{REVISION.free.callout.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="guide-card" delay={80}>
              <CardHead icon="warn" title={REVISION.paid.title} />
              <div className="guide-card-body">
                <ul className="guide-bullets">
                  {REVISION.paid.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <div className="rev-callout warn">
                  <span className="rev-callout-icon">
                    <GuideIcon name="warn" />
                  </span>
                  <div>
                    <strong>{REVISION.paid.callout.title}</strong>
                    <p>{REVISION.paid.callout.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="guide-card feedback-card" delay={140}>
            <CardHead icon="chat" title={REVISION.feedback.title} />
            <div className="guide-card-body feedback-row">
              {REVISION.feedback.items.map((f) => (
                <div className="feedback-item" key={f.title}>
                  <span className="feedback-icon">
                    <GuideIcon name={f.icon} />
                  </span>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 주의 및 안내사항 */}
      <section className="divider svc-section" id="svc-notices">
        <div className="wrap">
          <GuideHeading head={NOTICE.head} />
          <div className="guide-grid-2">
            {NOTICE.cards.map((c, i) => (
              <Reveal className="guide-card" key={c.title} delay={i * 60}>
                <CardHead icon={c.icon} title={c.title} />
                <div className="guide-card-body">
                  <ul className="guide-bullets">
                    {c.items.map((it) => (
                      <li key={it.text} className={it.strong ? 'is-strong' : undefined}>
                        {it.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 문의 */}
      <section className="cta section-watermark svc-closing-section">
        <FloralMark />
        <img
          src="/images/muare-mark-light.png"
          alt=""
          className="section-watermark-mark"
          aria-hidden="true"
        />
        <div className="wrap">
          <Reveal>
            {CLOSING.map((p, i) => (
              <p className="svc-closing-p" key={i}>
                {p}
              </p>
            ))}
            <div className="cta-btn-row">
              <a href={content.contact.kakao || KAKAO_FALLBACK_URL} target="_blank" rel="noreferrer" className="cta-btn">
                카카오톡 상담
              </a>
              <Link to="/consult" className="cta-btn cta-btn-ghost">
                <svg className="cta-btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="4" y="2.5" width="12" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7 7h6M7 10.2h6M7 13.4h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                상담게시판
              </Link>
            </div>
            <div>
              <Link to="/" className="svc-back svc-back-bottom">
                ← 홈으로 돌아가기
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer site={content.site} contact={content.contact} />
    </>
  )
}
