import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/Hero'
import About from '../components/About'
import ServiceTargets from '../components/ServiceTargets'
import PortfolioSection from '../components/PortfolioSection'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import ProjectView from '../components/ProjectView'
import { useSiteContent, usePortfolios } from '../hooks/useSiteData'
import { isSupabaseConfigured } from '../lib/supabase'
import { PLACEHOLDER_PORTFOLIOS } from '../content/defaults'
import type { Portfolio } from '../lib/types'

export default function Home() {
  const { content } = useSiteContent()
  const { portfolios, loading } = usePortfolios()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()

  /**
   * 다른 페이지(예: /service)에서 About / Portfolio / Contact 를 눌러
   * "/#about" 같은 주소로 들어온 경우, 화면이 다 그려진 다음 해당 위치로
   * 스크롤합니다. (예전에는 새로고침 시점에 브라우저가 먼저 스크롤을
   * 시도해서 실패했었습니다 — 프레임을 한 번 넘겨 레이아웃이 자리잡은
   * 뒤에 스크롤하면 항상 정확한 위치로 이동합니다)
   */
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [location.hash])

  // Supabase 연결 전이거나 등록된 작품이 없으면 기존 홈페이지의 항목을 그대로 보여줍니다
  const list: Portfolio[] =
    portfolios.length > 0 ? portfolios : loading ? [] : PLACEHOLDER_PORTFOLIOS

  const [openProject, setOpenProject] = useState<Portfolio | null>(null)

  /* /work/:slug 로 직접 들어온 경우 해당 프로젝트를 엽니다 */
  useEffect(() => {
    if (!slug) {
      setOpenProject(null)
      return
    }
    const found = list.find((p) => p.slug === slug || p.id === slug)
    if (found) setOpenProject(found)
  }, [slug, list])

  function open(p: Portfolio) {
    if (p.id.startsWith('placeholder-')) return // 자리표시 항목은 상세가 없습니다
    setOpenProject(p)
    window.history.pushState({}, '', `/work/${p.slug || p.id}`)
  }
  function close() {
    setOpenProject(null)
    window.history.pushState({}, '', '/')
    navigate('/', { replace: true })
  }

  const openIdx = openProject ? list.findIndex((p) => p.id === openProject.id) : -1
  const next = openIdx >= 0 ? list[(openIdx + 1) % list.length] : null

  return (
    <>
      <Header site={content.site} />
      <Hero hero={content.hero} />
      <About about={content.about} />

      {/* 서비스 자세히 보기 바로 아래 — 서비스 대상(다) 미리보기.
          전체 내용(작업범위/작업순서 등)은 /about 페이지에서 이어집니다. */}
      <section className="divider svc-section" id="home-targets">
        <div className="wrap">
          <ServiceTargets />
        </div>
      </section>

      <PortfolioSection head={content.portfolio} projects={list} onOpen={open} />
      <Contact contact={content.contact} />
      <Footer site={content.site} contact={content.contact} />

      {openProject && (
        <ProjectView
          project={openProject}
          nextProject={next && next.id !== openProject.id ? next : null}
          onClose={close}
          onNavigate={open}
        />
      )}

      {!isSupabaseConfigured && (
        <div className="site-notice">
          <strong>개발 모드</strong> — Supabase 연결 전이라 예시 콘텐츠가 표시되고 있습니다.
          <br />
          <code>.env</code> 파일에 연결 정보를 넣으면 실제 데이터로 바뀝니다.
        </div>
      )}
    </>
  )
}
