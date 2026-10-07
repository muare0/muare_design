import { NavLink, Outlet } from 'react-router-dom'

const MENU = [
  { to: '/admin', label: 'Portfolio', end: true },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/consultations', label: 'Consultations' },
  { to: '/admin/design', label: 'Design' },
  { to: '/admin/settings', label: 'Site Settings' },
]

export default function AdminLayout({
  email,
  onSignOut,
}: {
  email: string
  onSignOut: () => void
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-mark">MUARE ADMIN</div>
        <nav className="admin-nav">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="side-email" style={{ marginBottom: 12, wordBreak: 'break-all' }}>
            {email}
          </div>
          <button className="btn ghost sm" onClick={onSignOut}>
            Logout
          </button>
          <div className="side-home" style={{ marginTop: 14 }}>
            <a href="/" target="_blank" rel="noreferrer" className="link-underline">
              홈페이지 보기 ↗
            </a>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
