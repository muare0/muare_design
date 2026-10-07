import { useEffect, useState } from 'react'
import { useDesignTokens } from '../hooks/useSiteData'
import { saveDesignTokens } from '../lib/portfolioService'
import { DEFAULT_DESIGN } from '../content/defaults'
import type { DesignTokens } from '../lib/types'
import { PageDiagram, SectionPreviewCard } from './SectionPreview'

const COLORS: { key: string; name: string; note: string }[] = [
  { key: '--bg', name: 'Background', note: '홈페이지 바탕색' },
  { key: '--text', name: 'Text', note: '본문 글자색' },
  { key: '--text-soft', name: 'Text (soft)', note: '설명글 등 옅은 글자색' },
  { key: '--terracotta', name: 'Accent', note: '밑줄·강조에 쓰이는 색' },
  { key: '--line', name: 'Border', note: '구분선 색' },
  { key: '--bg-deep', name: 'Deep', note: 'Contact 영역의 어두운 배경' },
  { key: '--wood', name: 'Wood', note: '보조 색' },
]

const HEADING_FONTS = [
  { label: 'Cormorant (현재)', value: "'Cormorant', serif" },
  { label: 'Pretendard', value: "'Pretendard Variable', sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
]
const BODY_FONTS = [
  { label: 'Pretendard (현재)', value: "'Pretendard Variable','Inter',sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Cormorant', value: "'Cormorant', serif" },
]

export default function DesignSettings({ onToast }: { onToast: (m: string) => void }) {
  const { tokens, reload } = useDesignTokens()
  const [draft, setDraft] = useState<DesignTokens>(tokens)
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(tokens), [tokens])

  /* 편집 중에는 화면에 바로 반영해서 결과를 눈으로 확인할 수 있게 합니다 */
  useEffect(() => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(draft)) root.style.setProperty(k, v)
  }, [draft])

  function set(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await saveDesignTokens(draft)
      await reload()
      onToast('디자인 설정을 저장했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    if (!confirm('원래 디자인으로 되돌릴까요?')) return
    setDraft(DEFAULT_DESIGN)
    onToast('원래 디자인으로 되돌렸습니다. 저장을 눌러야 반영됩니다.')
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Design</h1>
          <p className="admin-desc">
            홈페이지 전체의 색과 서체를 조절합니다. 바꾸는 즉시 이 화면에 반영되며, 저장을
            눌러야 홈페이지에 적용됩니다.
          </p>
        </div>
      </div>

      <div className="setup-note">
        <strong>되돌리기 안심 안내</strong> — 마음에 들지 않으면 아래{' '}
        <strong>원래 디자인으로 되돌리기</strong> 를 누르면 처음 상태로 완전히 돌아옵니다.
      </div>

      <div className="editor-block">
        <h3>COLORS — 색상</h3>
        <div className="with-preview">
          <div>
            {COLORS.map((c) => (
              <div className="color-row" key={c.key}>
                <label className="color-swatch">
                  <input
                    type="color"
                    value={(draft[c.key] || '#000000').slice(0, 7)}
                    onChange={(e) => set(c.key, e.target.value.toUpperCase())}
                  />
                </label>
                <div className="name">
                  {c.name}
                  <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 3 }}>
                    {c.note}
                  </div>
                </div>
                <div className="code">{draft[c.key]}</div>
              </div>
            ))}
          </div>
          <SectionPreviewCard caption="색상과 서체는 홈페이지·서비스 페이지 등 모든 페이지, 모든 영역에 함께 적용됩니다.">
            <PageDiagram
              page="home"
              highlight={['header', 'hero', 'about', 'portfolio', 'contact', 'footer']}
            />
          </SectionPreviewCard>
        </div>
      </div>

      <div className="editor-block">
        <h3>TYPOGRAPHY — 서체</h3>
        <div className="editor-grid">
          <div className="field">
            <label>제목 서체</label>
            <select
              value={draft['--font-heading']}
              onChange={(e) => set('--font-heading', e.target.value)}
            >
              {HEADING_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>본문 서체</label>
            <select
              value={draft['--font-body']}
              onChange={(e) => set('--font-body', e.target.value)}
            >
              {BODY_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              제목 크기 — {Math.round(parseFloat(draft['--heading-scale'] || '1') * 100)}%
            </label>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={parseFloat(draft['--heading-scale'] || '1')}
              onChange={(e) => set('--heading-scale', e.target.value)}
            />
          </div>
          <div className="field">
            <label>본문 크기 — {draft['--body-size']}</label>
            <input
              type="range"
              min="14"
              max="19"
              step="1"
              value={parseInt(draft['--body-size'] || '16', 10)}
              onChange={(e) => set('--body-size', `${e.target.value}px`)}
            />
          </div>
          <div className="field">
            <label>자간 — {draft['--letter-spacing']}</label>
            <input
              type="range"
              min="-0.02"
              max="0.08"
              step="0.01"
              value={parseFloat(draft['--letter-spacing'] || '0')}
              onChange={(e) => set('--letter-spacing', `${e.target.value}em`)}
            />
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn" onClick={() => void save()} disabled={saving}>
          {saving ? '저장 중…' : 'SAVE DESIGN'}
        </button>
        <button className="btn ghost" onClick={reset}>
          원래 디자인으로 되돌리기
        </button>
      </div>
    </>
  )
}
