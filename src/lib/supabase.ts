import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase 연결.
 *
 * .env 파일에 아래 두 값을 넣으면 자동으로 연결됩니다.
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 *
 * 아직 값이 없으면 supabase 는 null 이 되고, 홈페이지는
 * src/content/defaults.ts 의 기본 콘텐츠로 정상 동작합니다.
 * (즉, Supabase 없이도 사이트가 깨지지 않습니다.)
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('xxxxxxxx') && anonKey.length > 20,
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'muare-auth',
      },
    })
  : null

export const STORAGE_BUCKET = 'portfolio-images'

/** Storage 경로 → 공개 URL */
export function publicUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Supabase 가 설정되지 않았을 때 호출부에서 쓰는 안내 문구 */
export const NOT_CONFIGURED_MESSAGE =
  'Supabase 연결 정보가 없습니다. 프로젝트 루트에 .env 파일을 만들고 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 입력해 주세요.'
