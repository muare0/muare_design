import { supabase, STORAGE_BUCKET, publicUrl } from './supabase'
import { processImage, safeFileStem, originalExt } from './imageProcessor'
import type { ImageQuality, Portfolio, PortfolioImage } from './types'

function client() {
  if (!supabase) throw new Error('Supabase 연결 정보가 없습니다. .env 파일을 확인해 주세요.')
  return supabase
}

/* ------------------------------------------------------------------ */
/* 프로젝트                                                            */
/* ------------------------------------------------------------------ */

export async function createPortfolio(
  input: Partial<Portfolio>,
): Promise<Portfolio> {
  const db = client()
  const { data: maxRow } = await db
    .from('portfolios')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await db
    .from('portfolios')
    .insert({
      title: input.title || '제목 없음',
      title_en: input.title_en ?? null,
      category: input.category ?? null,
      year: input.year ?? null,
      client: input.client ?? null,
      role: input.role ?? null,
      description: input.description ?? null,
      slug: input.slug || null,
      published: input.published ?? false,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single()

  if (error) throw error
  return data as Portfolio
}

export async function updatePortfolio(id: string, patch: Partial<Portfolio>) {
  const db = client()
  const { images: _images, ...rest } = patch
  void _images
  const { error } = await db.from('portfolios').update(rest).eq('id', id)
  if (error) throw error
}

/** 프로젝트 삭제 — Storage 파일까지 함께 정리합니다 */
export async function deletePortfolio(id: string) {
  const db = client()
  const { data: imgs } = await db
    .from('portfolio_images')
    .select('storage_path, thumb_path, original_path')
    .eq('portfolio_id', id)

  const paths: string[] = []
  for (const i of imgs ?? []) {
    if (i.storage_path) paths.push(i.storage_path)
    if (i.thumb_path) paths.push(i.thumb_path)
    if (i.original_path) paths.push(i.original_path)
  }
  if (paths.length) {
    await db.storage.from(STORAGE_BUCKET).remove(paths)
  }
  // portfolio_images 는 ON DELETE CASCADE 로 함께 지워집니다
  const { error } = await db.from('portfolios').delete().eq('id', id)
  if (error) throw error
}

export async function reorderPortfolios(ordered: Portfolio[]) {
  const db = client()
  await Promise.all(
    ordered.map((p, i) => db.from('portfolios').update({ sort_order: i }).eq('id', p.id)),
  )
}

/* ------------------------------------------------------------------ */
/* 이미지                                                              */
/* ------------------------------------------------------------------ */

export interface UploadProgress {
  fileName: string
  /** 0~100 */
  percent: number
  stage: 'processing' | 'uploading' | 'done' | 'error'
  message?: string
}

/**
 * 이미지 한 장을 업로드합니다.
 *   1) 브라우저에서 원본을 읽어 웹용/썸네일을 만들고
 *   2) 원본 · 웹용 · 썸네일 3개를 Storage 에 올린 뒤
 *   3) DB 에 경로와 순서를 기록합니다.
 */
export async function uploadPortfolioImage(
  portfolioId: string,
  file: File,
  quality: ImageQuality,
  sortOrder: number,
  onProgress?: (p: UploadProgress) => void,
): Promise<PortfolioImage> {
  const db = client()
  const report = (percent: number, stage: UploadProgress['stage'], message?: string) =>
    onProgress?.({ fileName: file.name, percent, stage, message })

  report(5, 'processing')
  const processed = await processImage(file, quality)
  report(35, 'uploading')

  const stem = safeFileStem(file.name)
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const base = `${portfolioId}`

  const webPath = `${base}/web/${stem}-${stamp}.${processed.ext}`
  const thumbPath = `${base}/thumb/${stem}-${stamp}.${processed.ext}`
  const originalPath = `${base}/original/${stem}-${stamp}.${originalExt(file.name)}`

  const storage = db.storage.from(STORAGE_BUCKET)
  const opts = { cacheControl: '31536000', upsert: false }

  const webUp = await storage.upload(webPath, processed.web, {
    ...opts,
    contentType: processed.web.type,
  })
  if (webUp.error) throw webUp.error
  report(60, 'uploading')

  const thumbUp = await storage.upload(thumbPath, processed.thumb, {
    ...opts,
    contentType: processed.thumb.type,
  })
  if (thumbUp.error) throw thumbUp.error
  report(75, 'uploading')

  // 원본은 손대지 않고 그대로 보존합니다 (나중에 다시 내려받을 수 있도록)
  const origUp = await storage.upload(originalPath, file, {
    ...opts,
    contentType: file.type || 'application/octet-stream',
  })
  if (origUp.error) throw origUp.error
  report(92, 'uploading')

  const { data, error } = await db
    .from('portfolio_images')
    .insert({
      portfolio_id: portfolioId,
      storage_path: webPath,
      thumb_path: thumbPath,
      original_path: originalPath,
      image_url: publicUrl(webPath)!,
      thumb_url: publicUrl(thumbPath),
      quality,
      width: processed.webWidth,
      height: processed.webHeight,
      bytes: processed.web.size,
      original_bytes: processed.originalBytes,
      original_name: file.name,
      sort_order: sortOrder,
    })
    .select()
    .single()

  URL.revokeObjectURL(processed.previewUrl)

  if (error) throw error
  report(100, 'done')
  return data as PortfolioImage
}

export async function deletePortfolioImage(image: PortfolioImage) {
  const db = client()
  const paths = [image.storage_path, image.thumb_path, image.original_path].filter(
    Boolean,
  ) as string[]
  if (paths.length) await db.storage.from(STORAGE_BUCKET).remove(paths)
  const { error } = await db.from('portfolio_images').delete().eq('id', image.id)
  if (error) throw error
}

/** 드래그로 바뀐 순서를 저장합니다 */
export async function reorderImages(images: PortfolioImage[]) {
  const db = client()
  await Promise.all(
    images.map((img, i) =>
      db.from('portfolio_images').update({ sort_order: i }).eq('id', img.id),
    ),
  )
}

export async function setCoverImage(portfolioId: string, imageId: string) {
  const db = client()
  const { error } = await db
    .from('portfolios')
    .update({ cover_image_id: imageId })
    .eq('id', portfolioId)
  if (error) throw error
}

export async function updateImageMeta(
  imageId: string,
  patch: Partial<Pick<PortfolioImage, 'alt' | 'caption'>>,
) {
  const db = client()
  const { error } = await db.from('portfolio_images').update(patch).eq('id', imageId)
  if (error) throw error
}

/** 보존해 둔 원본 내려받기 링크 */
export function originalDownloadUrl(image: PortfolioImage): string | null {
  return publicUrl(image.original_path)
}

/* ------------------------------------------------------------------ */
/* 콘텐츠 / 디자인 설정                                                */
/* ------------------------------------------------------------------ */

export async function saveContent(key: string, value: unknown) {
  const db = client()
  const { error } = await db
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

export async function saveDesignTokens(tokens: Record<string, string>) {
  const db = client()
  const rows = Object.entries(tokens).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await db.from('site_design').upsert(rows, { onConflict: 'key' })
  if (error) throw error
}
