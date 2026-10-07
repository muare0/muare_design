import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface AuthState {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  /** admins 테이블에 등록되지 않은 계정으로 로그인한 경우 */
  notAdmin: boolean
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
} {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setChecked(false)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // 로그인한 계정이 admins 테이블에 있는지 확인
  useEffect(() => {
    if (!supabase) return
    if (!session) {
      setIsAdmin(false)
      setChecked(true)
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      const { data } = await supabase!
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!cancelled) {
        setIsAdmin(Boolean(data))
        setChecked(true)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return 'Supabase 연결 정보가 없습니다.'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    if (error.message.toLowerCase().includes('invalid login')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    }
    return error.message
  }

  async function signOut() {
    await supabase?.auth.signOut()
  }

  return {
    session,
    isAdmin,
    loading,
    notAdmin: Boolean(session) && checked && !isAdmin,
    signIn,
    signOut,
  }
}
