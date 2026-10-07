import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolios, coverOf } from '../hooks/useSiteData'
import {
  createPortfolio,
  deletePortfolio,
  updatePortfolio,
  reorderPortfolios,
} from '../lib/portfolioService'
import type { Portfolio } from '../lib/types'

export default function PortfolioList({ onToast }: { onToast: (m: string) => void }) {
  const { portfolios, loading, error, reload } = usePortfolios({ includeUnpublished: true })
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function addProject() {
    setBusy(true)
    try {
      const created = await createPortfolio({ title: '새 프로젝트', year: String(new Date().getFullYear()) })
      navigate(`/admin/project/${created.id}`)
    } catch (err) {
      onToast(err instanceof Error ? err.message : '생성에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(p: Portfolio) {
    try {
      await updatePortfolio(p.id, { published: !p.published })
      await reload()
      onToast(p.published ? '비공개로 바꿨습니다.' : '홈페이지에 공개했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '실패했습니다.')
    }
  }

  async function remove(p: Portfolio) {
    if (
      !confirm(
        `"${p.title}" 프로젝트를 삭제할까요?\n등록된 사진(원본 포함)도 함께 삭제되며 되돌릴 수 없습니다.`,
      )
    )
      return
    try {
      await deletePortfolio(p.id)
      await reload()
      onToast('프로젝트를 삭제했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    }
  }

  async function move(p: Portfolio, dir: -1 | 1) {
    const idx = portfolios.findIndex((x) => x.id === p.id)
    const target = idx + dir
    if (target < 0 || target >= portfolios.length) return
    const next = [...portfolios]
    const [m] = next.splice(idx, 1)
    next.splice(target, 0, m)
    try {
      await reorderPortfolios(next)
      await reload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : '순서 변경에 실패했습니다.')
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Portfolio</h1>
          <p className="admin-desc one-line">
            홈페이지 Portfolio 영역에 보여줄 프로젝트를 관리합니다. 위에 있는 프로젝트가
            홈페이지에서도 먼저 보입니다.
          </p>
        </div>
        <button className="btn" onClick={() => void addProject()} disabled={busy}>
          + ADD PROJECT
        </button>
      </div>

      {error && <div className="form-msg error" style={{ marginBottom: 24 }}>{error}</div>}

      {loading ? (
        <div className="admin-empty">불러오는 중…</div>
      ) : portfolios.length === 0 ? (
        <div className="admin-empty">
          아직 등록된 프로젝트가 없습니다.
          <br />
          오른쪽 위 <strong>+ ADD PROJECT</strong> 를 눌러 첫 작품을 추가해 보세요.
        </div>
      ) : (
        <div>
          {portfolios.map((p, i) => {
            const cover = coverOf(p)
            return (
              <div className="proj-row" key={p.id}>
                <div className="proj-thumb">
                  {cover && <img src={cover.thumb_url || cover.image_url} alt="" />}
                </div>
                <div>
                  <div className="proj-name">{p.title}</div>
                  <div className="proj-sub">
                    {[p.category, p.year].filter(Boolean).join(' · ') || '분류 없음'} ·{' '}
                    사진 {p.images?.length ?? 0}장
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge${p.published ? ' on' : ''}`}>
                      {p.published ? '공개 중' : '비공개'}
                    </span>
                  </div>
                </div>
                <div className="proj-actions">
                  <button
                    className="tile-btn"
                    onClick={() => void move(p, -1)}
                    disabled={i === 0}
                    aria-label="위로"
                  >
                    ↑
                  </button>
                  <button
                    className="tile-btn"
                    onClick={() => void move(p, 1)}
                    disabled={i === portfolios.length - 1}
                    aria-label="아래로"
                  >
                    ↓
                  </button>
                  <button className="btn ghost sm" onClick={() => void togglePublished(p)}>
                    {p.published ? '비공개로' : '공개하기'}
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => navigate(`/admin/project/${p.id}`)}
                  >
                    편집
                  </button>
                  <button className="btn danger sm" onClick={() => void remove(p)}>
                    삭제
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
