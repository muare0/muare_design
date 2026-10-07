import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { DEFAULT_CONTENT, DEFAULT_DESIGN } from '../content/defaults'
import type { SiteContent, DesignTokens, Portfolio, PortfolioImage } from '../lib/types'

/* ------------------------------------------------------------------ */
/* 사이트 콘텐츠 (Hero / About / Service / Contact ...)                 */
/* ------------------------------------------------------------------ */
export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('site_content').select('key, value')
    if (!error && data?.length) {
      const merged = { ...DEFAULT_CONTENT } as Record<string, unknown>
      for (const row of data) {
        // 저장된 값이 비어있으면 기본값을 유지 (브랜드 문구 유실 방지)
        if (row.value && Object.keys(row.value).length) {
          merged[row.key] = { ...(merged[row.key] as object), ...row.value }
        }
      }
      setContent(merged as unknown as SiteContent)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { content, loading, reload: load }
}

/* ------------------------------------------------------------------ */
/* 디자인 토큰 → :root CSS 변수로 주입                                  */
/* ------------------------------------------------------------------ */
export function useDesignTokens() {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_DESIGN)

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('site_design').select('key, value')
    if (!error && data?.length) {
      const merged = { ...DEFAULT_DESIGN }
      for (const row of data) if (row.value) merged[row.key] = row.value
      setTokens(merged)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v)
  }, [tokens])

  return { tokens, reload: load }
}

/* ------------------------------------------------------------------ */
/* 포트폴리오 목록 + 이미지                                             */
/* ------------------------------------------------------------------ */
interface UsePortfoliosOptions {
  /** true 면 비공개 항목도 포함 (관리자용) */
  includeUnpublished?: boolean
}

export function usePortfolios({ includeUnpublished = false }: UsePortfoliosOptions = {}) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) {
      setPortfolios([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let query = supabase
      .from('portfolios')
      .select('*, images:portfolio_images!portfolio_images_portfolio_id_fkey(*)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!includeUnpublished) query = query.eq('published', true)

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
      setPortfolios([])
    } else {
      const rows = (data ?? []).map((p) => ({
        ...p,
        images: [...((p.images as PortfolioImage[]) ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      })) as Portfolio[]
      setPortfolios(rows)
    }
    setLoading(false)
  }, [includeUnpublished])

  useEffect(() => {
    void load()
  }, [load])

  return { portfolios, loading, error, reload: load }
}

/* ------------------------------------------------------------------ */
/* 대표 이미지 고르기 (cover 지정 → 없으면 첫 이미지)                    */
/* ------------------------------------------------------------------ */
export function coverOf(p: Portfolio): PortfolioImage | null {
  if (!p.images?.length) return null
  if (p.cover_image_id) {
    const found = p.images.find((i) => i.id === p.cover_image_id)
    if (found) return found
  }
  return p.images[0]
}
