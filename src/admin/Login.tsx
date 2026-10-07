import { useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login({
  onSignIn,
  notAdmin,
  onSignOut,
}: {
  onSignIn: (email: string, password: string) => Promise<string | null>
  notAdmin: boolean
  onSignOut: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await onSignIn(email.trim(), password)
    if (err) setError(err)
    setBusy(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-mark">MUARE</div>
          <div className="login-sub">ADMIN</div>
          <div className="setup-note">
            <strong>아직 Supabase 연결 전입니다.</strong>
            <br />
            관리자 기능을 쓰려면 아래 순서로 준비해 주세요.
            <ol>
              <li>
                supabase.com 에서 프로젝트를 만듭니다
              </li>
              <li>
                <code>supabase/schema.sql</code> 을 SQL Editor 에 붙여넣고 실행합니다
              </li>
              <li>
                프로젝트 폴더에 <code>.env</code> 파일을 만들고{' '}
                <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> 를
                넣습니다
              </li>
              <li>화면을 새로고침합니다</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  if (notAdmin) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-mark">MUARE</div>
          <div className="login-sub">ADMIN</div>
          <div className="setup-note">
            <strong>관리자로 등록되지 않은 계정입니다.</strong>
            <br />
            Supabase 대시보드의 SQL Editor 에서 아래를 실행해 이 계정을 관리자로 등록해
            주세요.
            <br />
            <br />
            <code>
              insert into public.admins (user_id, email) select id, email from auth.users
              where email = '내이메일';
            </code>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button className="btn ghost sm" onClick={onSignOut}>
              다른 계정으로 로그인
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-mark">MUARE</div>
        <div className="login-sub">ADMIN</div>

        <form className="login-form" onSubmit={submit}>
          <div className="field">
            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="form-msg error">{error}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? '확인 중…' : 'ENTER'}
          </button>
        </form>
      </div>
    </div>
  )
}
