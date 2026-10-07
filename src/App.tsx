import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Work from './pages/Work'
import ServicePage from './pages/ServicePage'
import ConsultBoard from './pages/ConsultBoard'
import ConsultWrite from './pages/ConsultWrite'
import ConsultDetail from './pages/ConsultDetail'
import { useDesignTokens, useSiteContent } from './hooks/useSiteData'
import { useEffect, lazy, Suspense } from 'react'
import './styles/site.css'
import './styles/guide.css'

/* AdminApp은 관리자 화면(/admin/*)에서만 필요합니다. 예전처럼 위에서 바로 import 하면
   admin.css가 홈페이지를 포함한 모든 페이지에 항상 함께 실려서, 관리자 전용 스타일(예:
   .consult-contact-card 모바일 규칙)이 방문자용 페이지에도 섞여 들어가는 문제가 있었습니다.
   /admin 경로에 들어갈 때만 불러오도록 지연 로드(lazy)로 분리합니다. */
const AdminApp = lazy(() => import('./admin/AdminApp'))

/** 관리자에서 저장한 제목/설명을 <head> 에 반영합니다 */
function HeadSync() {
  const { content } = useSiteContent()
  useEffect(() => {
    document.title = content.site.title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', content.site.metaDescription)
  }, [content.site])
  return null
}

function Site() {
  useDesignTokens()
  return (
    <>
      <HeadSync />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/service" element={<ServicePage />} />
        {/* 예전 주소(/about)로 들어와도 서비스 페이지로 연결됩니다 */}
        <Route path="/about" element={<Navigate to="/service" replace />} />
        <Route path="/consult" element={<ConsultBoard />} />
        <Route path="/consult/write" element={<ConsultWrite />} />
        <Route path="/consult/:id/edit" element={<ConsultWrite />} />
        <Route path="/consult/:id" element={<ConsultDetail />} />
        <Route path="/work/:slug" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<Site />} />
      </Routes>
    </BrowserRouter>
  )
}
