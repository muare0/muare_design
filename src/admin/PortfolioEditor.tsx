import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { updatePortfolio, deletePortfolio } from '../lib/portfolioService'
import ImageManager from './ImageManager'
import ProjectView from '../components/ProjectView'
import type { ImageQuality, Portfolio, PortfolioImage } from '../lib/types'

export default function PortfolioEditor({ onToast }: { onToast: (m: string) => void }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(false)
  const [quality, setQuality] = useState<ImageQuality>('high')

  const load = useCallback(async () => {
    if (!supabase || !id) return
    const { data, error } = await supabase
      .from('portfolios')
      .select('*, images:portfolio_images!portfolio_images_portfolio_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) {
      onToast(error.message)
      setLoading(false)
      return
    }
    const row = {
      ...data,
      images: [...((data.images as PortfolioImage[]) ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    } as Portfolio
    setProject(row)
    setLoading(false)
  }, [id, onToast])

  useEffect(() => {
    void load()
  }, [load])

  /* 저장하지 않고 나가려 할 때 경고 */
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function set<K extends keyof Portfolio>(key: K, value: Portfolio[K]) {
    setProject((p) => (p ? { ...p, [key]: value } : p))
    setDirty(true)
  }

  async function save(alsoPublish?: boolean) {
    if (!project) return
    setSaving(true)
    try {
      await updatePortfolio(project.id, {
        title: project.title,
        title_en: project.title_en,
        category: project.category,
        year: project.year,
        client: project.client,
        role: project.role,
        description: project.description,
        slug: project.slug,
        published: alsoPublish ?? project.published,
      })
      if (alsoPublish !== undefined) set('published', alsoPublish)
      setDirty(false)
      onToast(
        alsoPublish === true
          ? '저장하고 홈페이지에 공개했습니다.'
          : alsoPublish === false
            ? '저장하고 비공개로 바꿨습니다.'
            : '저장했습니다.',
      )
    } catch (err) {
      onToast(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!project) return
    if (!confirm(`"${project.title}" 을(를) 삭제할까요?\n사진(원본 포함)도 함께 삭제됩니다.`))
      return
    try {
      await deletePortfolio(project.id)
      onToast('삭제했습니다.')
      navigate('/admin')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    }
  }

  if (loading) return <div className="admin-empty">불러오는 중…</div>
  if (!project) return <div className="admin-empty">프로젝트를 찾을 수 없습니다.</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <button
            className="project-back"
            onClick={() => {
              if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 나갈까요?')) return
              navigate('/admin')
            }}
            style={{ marginBottom: 14 }}
          >
            <span className="arrow">←</span> PORTFOLIO
          </button>
          <h1 className="admin-title">{project.title || '새 프로젝트'}</h1>
          <p className="admin-desc">
            제목과 설명을 적고, 아래에서 사진을 여러 장 올린 뒤 대표 사진을 정하면 됩니다.
          </p>
        </div>
        <span className={`badge${project.published ? ' on' : ''}`}>
          {project.published ? '공개 중' : '비공개'}
        </span>
      </div>

      {/* 프로젝트 정보 */}
      <div className="editor-block">
        <h3>PROJECT</h3>
        <div className="editor-grid">
          <div className="field">
            <label>PROJECT TITLE — 프로젝트 제목</label>
            <input
              value={project.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="예: 뮤아르 브랜드 아이덴티티"
            />
          </div>
          <div className="field">
            <label>SUBTITLE — 영문/부제 (선택)</label>
            <input
              value={project.title_en ?? ''}
              onChange={(e) => set('title_en', e.target.value)}
              placeholder="MUARE BRAND IDENTITY"
            />
          </div>
          <div className="field">
            <label>CATEGORY — 분류</label>
            <input
              value={project.category ?? ''}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Brand Identity / Editorial Design ..."
              list="muare-categories"
            />
            <datalist id="muare-categories">
              <option value="Brand Design" />
              <option value="Brand Identity" />
              <option value="Graphic Design" />
              <option value="Editorial Design" />
              <option value="Visual Design" />
              <option value="Packaging" />
              <option value="Custom Design" />
            </datalist>
          </div>
          <div className="field">
            <label>YEAR — 연도</label>
            <input
              value={project.year ?? ''}
              onChange={(e) => set('year', e.target.value)}
              placeholder="2026"
            />
          </div>
          <div className="field">
            <label>CLIENT — 클라이언트 (선택)</label>
            <input
              value={project.client ?? ''}
              onChange={(e) => set('client', e.target.value)}
            />
          </div>
          <div className="field">
            <label>ROLE — 담당 역할 (선택)</label>
            <input
              value={project.role ?? ''}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Art Direction, Design"
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 24 }}>
          <label>DESCRIPTION — 프로젝트 설명</label>
          <textarea
            value={project.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="이 프로젝트에서 무엇을 어떻게 풀어냈는지 적어주세요. 줄바꿈은 그대로 반영됩니다."
          />
        </div>

        <div className="field" style={{ marginTop: 24 }}>
          <label>URL 주소 (선택)</label>
          <input
            value={project.slug ?? ''}
            onChange={(e) =>
              set('slug', e.target.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase())
            }
            placeholder="muare-brand-identity"
          />
          <span className="hint">
            비워두셔도 됩니다. 적으면 주소가 <code>/work/{project.slug || '주소'}</code> 로
            보기 좋게 바뀝니다.
          </span>
        </div>
      </div>

      {/* 이미지 */}
      <div className="editor-block">
        <h3>PROJECT IMAGES</h3>
        <ImageManager
          portfolioId={project.id}
          images={project.images ?? []}
          coverId={project.cover_image_id}
          quality={quality}
          onQualityChange={setQuality}
          onChange={load}
          onToast={onToast}
        />
      </div>

      {/* 저장 */}
      <div className="editor-actions">
        <button className="btn" onClick={() => void save()} disabled={saving}>
          {saving ? '저장 중…' : 'SAVE PROJECT'}
        </button>
        {!project.published ? (
          <button className="btn ghost" onClick={() => void save(true)} disabled={saving}>
            저장하고 공개하기
          </button>
        ) : (
          <button className="btn ghost" onClick={() => void save(false)} disabled={saving}>
            비공개로 바꾸기
          </button>
        )}
        <button className="btn ghost" onClick={() => setPreview(true)}>
          PREVIEW
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn danger sm" onClick={() => void remove()}>
          프로젝트 삭제
        </button>
        {dirty && (
          <span className="form-msg" style={{ color: 'var(--text-soft)' }}>
            저장하지 않은 변경사항이 있습니다
          </span>
        )}
      </div>

      {preview && <ProjectView project={project} onClose={() => setPreview(false)} />}
    </>
  )
}
