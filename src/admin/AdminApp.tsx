import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDesignTokens } from '../hooks/useSiteData'
import Login from './Login'
import AdminLayout from './AdminLayout'
import PortfolioList from './PortfolioList'
import PortfolioEditor from './PortfolioEditor'
import ContentSettings from './ContentSettings'
import DesignSettings from './DesignSettings'
import SiteSettings from './SiteSettings'
import Consultations from './Consultations'
import '../styles/admin.css'

export default function AdminApp() {
  const { session, isAdmin, loading, notAdmin, signIn, signOut } = useAuth()
  const [toast, setToast] = useState<string | null>(null)
  const location = useLocation()
  useDesignTokens() // 관리자 화면도 같은 색·서체를 씁니다

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return (
      <div className="admin-root">
        <div className="login-screen">
          <div className="login-card">
            <div className="login-mark">MUARE</div>
            <div className="login-sub">불러오는 중…</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="admin-root">
        <Login onSignIn={signIn} notAdmin={notAdmin} onSignOut={() => void signOut()} />
      </div>
    )
  }

  return (
    <div className="admin-root">
      <Routes>
        <Route
          element={
            <AdminLayout
              email={session.user.email ?? ''}
              onSignOut={() => void signOut()}
            />
          }
        >
          <Route index element={<PortfolioList onToast={setToast} />} />
          <Route path="project/:id" element={<PortfolioEditor onToast={setToast} />} />
          <Route path="content" element={<ContentSettings onToast={setToast} />} />
          <Route path="design" element={<DesignSettings onToast={setToast} />} />
          <Route path="settings" element={<SiteSettings onToast={setToast} />} />
          <Route path="consultations" element={<Consultations key={location.key} onToast={setToast} />} />
        </Route>
      </Routes>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
