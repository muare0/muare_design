import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { SiteMeta } from '../lib/types'

const LINKS = [
  { href: '#about', label: 'About', page: false },
  { href: '/service', label: 'Service', page: true },
  { href: '#portfolio', label: 'Portfolio', page: false },
  { href: '#contact', label: 'Contact', page: false },
]

/** 모바일에서도 햄버거 없이 항상 About / Service / Portfolio / Contact 가 바로 보입니다 */
export default function Header({ site }: { site: SiteMeta }) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { pathname } = location
  const navigate = useNavigate()
  const onHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 홈이 아닌 페이지에서는 해시 링크가 홈으로 가도록
  const hrefFor = (hash: string) => (onHome ? hash : `/${hash}`)

  /** 로고를 누르면 어떤 화면에 있든 항상 홈의 첫 화면(히어로)으로 이동합니다 */
  function goHome(e: React.MouseEvent) {
    e.preventDefault()
    if (!onHome) navigate('/')
    window.scrollTo({ top: 0, behavior: onHome ? 'smooth' : 'auto' })
  }

  /**
   * About / Portfolio / Contact 처럼 홈 화면 안의 특정 위치로 가는 링크.
   * 예전에는 다른 페이지(/service)에서 누르면 그냥 <a href="/#about"> 로
   * 전체 새로고침이 일어났는데, 이때 브라우저가 화면을 채 그리기도 전에
   * 해시로 스크롤을 시도하다 실패해서 홈 첫 화면에 멈춰버렸습니다
   * (그 상태에서 다시 누르면 이번엔 같은 페이지 안이라 정상 동작).
   * 그래서 새로고침 없이 라우터로만 이동시키고, 실제 스크롤은
   * Home 쪽에서 화면이 다 그려진 뒤에 처리합니다.
   */
  function goToHash(e: React.MouseEvent, hash: string) {
    e.preventDefault()
    const id = hash.slice(1)
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      if (location.hash !== hash) window.history.replaceState(null, '', hash)
    } else {
      navigate(`/${hash}`)
    }
  }

  return (
    <header id="site-header" className={scrolled ? 'scrolled' : undefined}>
      <style>{`
.muare-header-symbol, .muare-header-lettering { position: relative; display: block; overflow: hidden; flex-shrink: 0; }
#site-header .wordmark { align-items: center; }
.muare-header-symbol { width: 52px; aspect-ratio: 740 / 548; }
.muare-header-symbol img { position: absolute; width: 337.84%; max-width: none; left: -118.65%; top: -131.75%; }
.muare-header-name { display: grid; justify-items: center; gap: 6px; }
.muare-header-lettering { width: 104px; aspect-ratio: 1056 / 240; }
.muare-header-lettering img { position: absolute; width: 236.74%; max-width: none; left: -68.37%; top: -17.5%; }
.muare-header-descriptor { display: block; width: 100%; height: 9px; font: 500 9px var(--font-body); fill: currentColor; }
#site-header:not(.scrolled):has(+ .hero) .muare-header-symbol img,
#site-header:not(.scrolled):has(+ .hero) .muare-header-lettering img { filter: brightness(0) invert(1); }
@media (max-width: 520px) {
  .muare-header-symbol { width: 38px; }
  .muare-header-lettering { width: 76px; }
  .muare-header-name { gap: 4px; }
  .muare-header-descriptor { height: 7px; }
}
`}</style>
      <div className="wrap headrow">
        <Link to="/" className="wordmark" onClick={goHome}>
          <span className="muare-header-symbol">
            <img src="/images/muare-header-symbol.png" alt="" />
          </span>
          <span className="muare-header-name">
            <span className="muare-header-lettering">
              <img src="/images/muare-header-lettering.png" alt={site.wordmark} />
            </span>
            <svg className="muare-header-descriptor" viewBox="0 0 104 9" aria-label="Design Studio" role="img">
              <text x="0" y="8" textLength="104" lengthAdjust="spacing">DESIGN STUDIO</text>
            </svg>
          </span>
        </Link>
        <nav className="desktop-nav">
          {LINKS.map((l) =>
            l.page ? (
              <Link key={l.href} to={l.href}>
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={hrefFor(l.href)} onClick={(e) => goToHash(e, l.href)}>
                {l.label}
              </a>
            ),
          )}
          {/* 상담게시판 바로가기 — Contact 오른편의 게시판 아이콘 */}
          <Link to="/consult" className="board-icon-link" title="상담게시판" aria-label="상담게시판 바로가기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2.2" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="13" y2="16" />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  )
}
