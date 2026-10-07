import { useRef, useState, useCallback } from 'react'
import type { ImageQuality, PortfolioImage } from '../lib/types'
import { QUALITY_PRESETS, formatBytes } from '../lib/imageProcessor'
import {
  uploadPortfolioImage,
  deletePortfolioImage,
  reorderImages,
  setCoverImage,
  originalDownloadUrl,
  type UploadProgress,
} from '../lib/portfolioService'

/**
 * 프로젝트 이미지 관리
 *  · 여러 장 한 번에 선택 / 드래그 앤 드롭 / 모바일 사진 선택
 *  · 업로드 진행률, 완료·실패 표시
 *  · 드래그로 순서 변경 (마우스 + 터치 모두 지원)
 *  · 대표 이미지 지정, 삭제, 원본 내려받기
 */
export default function ImageManager({
  portfolioId,
  images,
  coverId,
  quality,
  onQualityChange,
  onChange,
  onToast,
}: {
  portfolioId: string
  images: PortfolioImage[]
  coverId: string | null
  quality: ImageQuality
  onQualityChange: (q: ImageQuality) => void
  onChange: () => void | Promise<void>
  onToast: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [queue, setQueue] = useState<UploadProgress[]>([])
  const [busy, setBusy] = useState(false)

  // 드래그 정렬 상태
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<PortfolioImage[] | null>(null)

  const list = localOrder ?? images

  /* ---------------- 업로드 ---------------- */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (!arr.length) return

      setBusy(true)
      setQueue(arr.map((f) => ({ fileName: f.name, percent: 0, stage: 'processing' })))

      let ok = 0
      let failed = 0
      let order = images.length

      for (let i = 0; i < arr.length; i++) {
        const file = arr[i]
        try {
          await uploadPortfolioImage(portfolioId, file, quality, order++, (p) => {
            setQueue((q) => q.map((item, idx) => (idx === i ? p : item)))
          })
          ok++
        } catch (err) {
          failed++
          const msg = err instanceof Error ? err.message : '업로드 실패'
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, stage: 'error', percent: 100, message: msg } : item,
            ),
          )
        }
      }

      await onChange()
      setBusy(false)
      onToast(
        failed === 0
          ? `${ok}장을 올렸습니다.`
          : `${ok}장 성공 · ${failed}장 실패`,
      )
      // 성공한 항목은 잠시 뒤 목록에서 정리, 실패한 항목은 남겨 확인할 수 있게 합니다
      setTimeout(() => setQueue((q) => q.filter((i2) => i2.stage === 'error')), 2500)
    },
    [images.length, onChange, onToast, portfolioId, quality],
  )

  /* ---------------- 순서 변경 ---------------- */
  function beginDrag(id: string) {
    setDragId(id)
    setLocalOrder(images)
  }
  function hoverOver(id: string) {
    if (!dragId || id === dragId) return
    setOverId(id)
    setLocalOrder((cur) => {
      const base = cur ?? images
      const from = base.findIndex((i) => i.id === dragId)
      const to = base.findIndex((i) => i.id === id)
      if (from < 0 || to < 0 || from === to) return base
      const next = [...base]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }
  async function endDrag() {
    const ordered = localOrder
    setDragId(null)
    setOverId(null)
    if (!ordered) return
    const changed = ordered.some((img, i) => images[i]?.id !== img.id)
    if (!changed) {
      setLocalOrder(null)
      return
    }
    try {
      await reorderImages(ordered)
      await onChange()
      onToast('순서를 저장했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '순서 저장에 실패했습니다.')
    } finally {
      setLocalOrder(null)
    }
  }

  /* 터치 드래그: 손가락 아래에 있는 타일을 찾아 순서를 바꿉니다 */
  function onHandlePointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault()
    beginDrag(id)
    const move = (ev: PointerEvent) => {
      const el = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest('[data-img-id]') as HTMLElement | null
      const target = el?.dataset.imgId
      if (target) hoverOver(target)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      void endDrag()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* ---------------- 개별 동작 ---------------- */
  async function makeCover(img: PortfolioImage) {
    try {
      await setCoverImage(portfolioId, img.id)
      await onChange()
      onToast('대표 이미지로 지정했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '실패했습니다.')
    }
  }
  async function remove(img: PortfolioImage) {
    if (!confirm(`이 이미지를 삭제할까요?\n(원본까지 함께 삭제됩니다)`)) return
    try {
      await deletePortfolioImage(img)
      await onChange()
      onToast('이미지를 삭제했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    }
  }

  return (
    <div>
      {/* 품질 선택 */}
      <div className="field" style={{ marginBottom: 22 }}>
        <label>이미지 품질 — 홈페이지에 보여줄 이미지의 화질을 정합니다</label>
        <div className="quality-picker">
          {QUALITY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`quality-opt${quality === p.id ? ' active' : ''}`}
              onClick={() => onQualityChange(p.id)}
            >
              <div className="q-name">
                <span className="q-dot" />
                {p.label}
              </div>
              <div className="q-desc">
                {p.sublabel}
                <br />
                최대 {p.maxEdge.toLocaleString()}px
              </div>
            </button>
          ))}
        </div>
        <span className="hint">
          어떤 품질을 고르셔도 <strong>원본 사진은 손상 없이 그대로 보관</strong>됩니다.
          위 설정은 홈페이지에 표시될 이미지에만 적용되며, 언제든 원본을 다시 내려받을 수
          있습니다.
        </span>
      </div>

      {/* 업로드 영역 */}
      <div
        className={`dropzone${over ? ' over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="big">+ Add Images</div>
        <div className="small">
          사진을 여기에 끌어다 놓거나, 눌러서 선택하세요 · 여러 장을 한 번에 고를 수 있습니다
          <br />
          휴대폰에서는 눌러서 사진 앨범에서 바로 선택할 수 있습니다
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* 진행률 */}
      {queue.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {queue.map((q, i) => (
            <div key={`${q.fileName}-${i}`} style={{ marginBottom: 14 }}>
              <div className="upload-status">
                {q.fileName} —{' '}
                {q.stage === 'processing'
                  ? '이미지 준비 중'
                  : q.stage === 'uploading'
                    ? '업로드 중'
                    : q.stage === 'done'
                      ? '완료 ✓'
                      : '실패'}
              </div>
              <div className="upload-bar">
                <i style={{ width: `${q.percent}%` }} />
              </div>
              {q.stage === 'error' && (
                <div className="upload-status err">{q.message}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 이미지 타일 */}
      {list.length > 0 && (
        <>
          <p className="hint" style={{ marginTop: 26, fontSize: 11, color: 'var(--text-soft)' }}>
            타일 오른쪽 위의 손잡이를 끌어서 순서를 바꿀 수 있습니다. 순서는 자동으로
            저장되며, 홈페이지 상세 화면에 이 순서 그대로 나타납니다.
          </p>
          <div className="img-grid">
            {list.map((img, i) => {
              const isCover = coverId ? img.id === coverId : i === 0
              const orig = originalDownloadUrl(img)
              return (
                <div
                  key={img.id}
                  data-img-id={img.id}
                  className={`img-tile${dragId === img.id ? ' dragging' : ''}${
                    overId === img.id ? ' drop-target' : ''
                  }`}
                  draggable
                  onDragStart={() => beginDrag(img.id)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    hoverOver(img.id)
                  }}
                  onDragEnd={() => void endDrag()}
                  onDrop={(e) => {
                    e.preventDefault()
                    void endDrag()
                  }}
                >
                  {isCover && <span className="cover-flag">COVER</span>}
                  <button
                    className="drag-handle"
                    aria-label="순서 바꾸기"
                    onPointerDown={(e) => onHandlePointerDown(e, img.id)}
                  >
                    ⠿
                  </button>
                  <div className="pic">
                    <img src={img.thumb_url || img.image_url} alt={img.alt ?? ''} />
                  </div>
                  <div className="bar">
                    <div className="meta">
                      {String(i + 1).padStart(2, '0')} ·{' '}
                      {img.width && img.height ? `${img.width}×${img.height}` : '—'}
                      <br />
                      웹 {formatBytes(img.bytes)} / 원본 {formatBytes(img.original_bytes)}
                    </div>
                    <div className="row">
                      {!isCover && (
                        <button className="tile-btn" onClick={() => void makeCover(img)}>
                          대표로
                        </button>
                      )}
                      {orig && (
                        <a
                          className="tile-btn"
                          href={orig}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          원본
                        </a>
                      )}
                      <button className="tile-btn del" onClick={() => void remove(img)}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {busy && <div className="toast">업로드 중입니다… 창을 닫지 말아주세요.</div>}
    </div>
  )
}
