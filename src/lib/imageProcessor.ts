import type { ImageQuality } from './types'

/**
 * 이미지 처리 파이프라인 (전부 브라우저 안에서 처리됩니다)
 *
 *   원본 파일
 *      ├─ 원본 그대로 보존본        → Storage: <project>/original/xxx.jpg
 *      ├─ 웹 표시용 (리사이즈+WebP) → Storage: <project>/web/xxx.webp   ← 상세 페이지에서 사용
 *      └─ 썸네일 (작은 WebP)        → Storage: <project>/thumb/xxx.webp ← 목록에서 사용
 *
 * 원본은 절대 손대지 않고 그대로 올라가므로, 나중에 언제든 다시 받을 수 있습니다.
 */

export interface QualityPreset {
  id: ImageQuality
  label: string
  sublabel: string
  /** 웹 표시용 이미지의 긴 변 최대 픽셀 */
  maxEdge: number
  /** WebP 인코딩 품질 (0~1) */
  encodeQuality: number
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'max',
    label: '최고 화질',
    sublabel: '원본에 가까운 화질 · 디테일이 중요한 작품용',
    maxEdge: 3200,
    encodeQuality: 0.95,
  },
  {
    id: 'high',
    label: '고화질',
    sublabel: '일반적인 포트폴리오용 · 화질과 속도의 균형',
    maxEdge: 2400,
    encodeQuality: 0.88,
  },
  {
    id: 'web',
    label: '웹 최적화',
    sublabel: '빠른 로딩 우선 · 이미지 수가 많을 때',
    maxEdge: 1800,
    encodeQuality: 0.8,
  },
]

export const THUMB_MAX_EDGE = 900
export const THUMB_QUALITY = 0.82

export function getPreset(id: ImageQuality): QualityPreset {
  return QUALITY_PRESETS.find((p) => p.id === id) ?? QUALITY_PRESETS[1]
}

export interface ProcessedImage {
  /** 웹 표시용 */
  web: Blob
  webWidth: number
  webHeight: number
  /** 썸네일 */
  thumb: Blob
  /** 원본 (손대지 않은 그대로) */
  original: File
  originalWidth: number
  originalHeight: number
  originalBytes: number
  /** 확장자 (webp 또는 jpeg) */
  ext: 'webp' | 'jpg'
  /** 미리보기용 objectURL — 사용 후 revoke 필요 */
  previewUrl: string
}

let webpSupported: boolean | null = null
/** 브라우저가 WebP 인코딩을 지원하는지 (구형 사파리 대비) */
export function supportsWebpEncode(): boolean {
  if (webpSupported !== null) return webpSupported
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    webpSupported = c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    webpSupported = false
  }
  return webpSupported
}

export function formatBytes(n: number | null | undefined): string {
  if (!n && n !== 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** EXIF 회전까지 반영해서 이미지를 읽어옵니다 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* 아래 fallback 으로 */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다'))
      img.src = url
    })
    return img
  } finally {
    // objectURL 은 이미지가 디코딩된 뒤 해제
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function dimensionsOf(src: ImageBitmap | HTMLImageElement) {
  return src instanceof HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height }
}

/**
 * 단계적 축소(step-down). 한 번에 크게 줄이면 계단 현상이 생기므로
 * 절반씩 줄여가며 마지막에 목표 크기로 맞춥니다. 디테일 보존에 유리합니다.
 */
function drawResized(
  src: ImageBitmap | HTMLImageElement,
  targetW: number,
  targetH: number,
): HTMLCanvasElement {
  const { w: sw, h: sh } = dimensionsOf(src)
  let curW = sw
  let curH = sh
  let curCanvas: HTMLCanvasElement | null = null

  while (curW / 2 > targetW && curH / 2 > targetH) {
    const nextW = Math.max(targetW, Math.round(curW / 2))
    const nextH = Math.max(targetH, Math.round(curH / 2))
    const c = document.createElement('canvas')
    c.width = nextW
    c.height = nextH
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(curCanvas ?? (src as CanvasImageSource), 0, 0, nextW, nextH)
    curCanvas = c
    curW = nextW
    curH = nextH
  }

  const out = document.createElement('canvas')
  out.width = targetW
  out.height = targetH
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(curCanvas ?? (src as CanvasImageSource), 0, 0, targetW, targetH)
  return out
}

function fitWithin(w: number, h: number, maxEdge: number) {
  const longest = Math.max(w, h)
  if (longest <= maxEdge) return { w, h } // 확대는 하지 않습니다 (화질 손해)
  const ratio = maxEdge / longest
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다'))),
      type,
      quality,
    )
  })
}

/** 파일 한 장을 원본/웹용/썸네일 3종으로 가공합니다 */
export async function processImage(
  file: File,
  quality: ImageQuality,
): Promise<ProcessedImage> {
  const preset = getPreset(quality)
  const useWebp = supportsWebpEncode()
  const mime = useWebp ? 'image/webp' : 'image/jpeg'
  const ext: 'webp' | 'jpg' = useWebp ? 'webp' : 'jpg'

  const bitmap = await loadBitmap(file)
  const { w: ow, h: oh } = dimensionsOf(bitmap)

  const webSize = fitWithin(ow, oh, preset.maxEdge)
  const webCanvas = drawResized(bitmap, webSize.w, webSize.h)
  const web = await canvasToBlob(webCanvas, mime, preset.encodeQuality)

  const thumbSize = fitWithin(ow, oh, THUMB_MAX_EDGE)
  const thumbCanvas = drawResized(bitmap, thumbSize.w, thumbSize.h)
  const thumb = await canvasToBlob(thumbCanvas, mime, THUMB_QUALITY)

  if ('close' in bitmap) bitmap.close()

  return {
    web,
    webWidth: webSize.w,
    webHeight: webSize.h,
    thumb,
    original: file,
    originalWidth: ow,
    originalHeight: oh,
    originalBytes: file.size,
    ext,
    previewUrl: URL.createObjectURL(thumb),
  }
}

/** 파일명에서 안전한 slug 를 만듭니다 (한글 파일명 대응) */
export function safeFileStem(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '')
  const cleaned = stem
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return cleaned || 'image'
}

export function originalExt(name: string): string {
  const m = name.match(/\.([a-zA-Z0-9]+)$/)
  return (m ? m[1] : 'jpg').toLowerCase()
}
