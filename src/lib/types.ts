export type ImageQuality = 'max' | 'high' | 'web'

export interface PortfolioImage {
  id: string
  portfolio_id: string
  storage_path: string
  thumb_path: string | null
  original_path: string | null
  image_url: string
  thumb_url: string | null
  quality: ImageQuality
  width: number | null
  height: number | null
  bytes: number | null
  original_bytes: number | null
  original_name: string | null
  alt: string | null
  caption: string | null
  sort_order: number
  created_at?: string
}

export interface Portfolio {
  id: string
  slug: string | null
  title: string
  title_en: string | null
  category: string | null
  year: string | null
  client: string | null
  role: string | null
  description: string | null
  cover_image_id: string | null
  published: boolean
  featured: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  images?: PortfolioImage[]
}

export interface HeroContent {
  eyebrow: string
  titleTop: string
  titleBottom: string
  subtitle: string
  image: string
  /** 두 번째 배경으로 전환됐을 때 보여줄 문구 (없으면 첫 번째 문구를 그대로 씁니다) */
  eyebrow2?: string
  titleTop2?: string
  titleBottom2?: string
  subtitle2?: string
}
export interface AboutContent {
  eyebrow: string
  heading: string
  body: string[]
  image: string
  imageAlt: string
}
export interface SectionHead {
  eyebrow: string
  heading: string
}
/**
 * '서비스 자세히 보기' 페이지(/service) 맨 위 소개 문구.
 * 그 아래 내용(서비스 대상 · 작업범위 · 작업순서 · 안내사항 등)은 Supabase 상태와
 * 무관하게 항상 최신 내용으로 보이도록 src/content/serviceGuide.ts 에 직접
 * 작성되어 있어 여기서는 관리하지 않습니다.
 */
export interface ServiceInfoContent {
  eyebrow: string
  heading: string
  intro: string[]
}
export interface ContactContent {
  heading: string
  subtitle: string
  email: string
  instagram: string
  kakao: string
}
export interface SiteMeta {
  wordmark: string
  title: string
  metaDescription: string
  copyright: string
}

export interface SiteContent {
  hero: HeroContent
  about: AboutContent
  serviceInfo: ServiceInfoContent
  portfolio: SectionHead
  contact: ContactContent
  site: SiteMeta
}

export type DesignTokens = Record<string, string>
