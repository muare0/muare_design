import { useEffect, useState } from 'react'
import { useSiteContent } from '../hooks/useSiteData'
import { saveContent } from '../lib/portfolioService'
import type { SiteMeta } from '../lib/types'
import { PageDiagram, BrowserTabPreview, SearchCardPreview, SectionPreviewCard } from './SectionPreview'

export default function SiteSettings({ onToast }: { onToast: (m: string) => void }) {
  const { content, reload } = useSiteContent()
  const [site, setSite] = useState<SiteMeta>(content.site)
  const [saving, setSaving] = useState(false)

  useEffect(() => setSite(content.site), [content.site])

  async function save() {
    setSaving(true)
    try {
      await saveContent('site', site)
      await reload()
      onToast('사이트 설정을 저장했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Site Settings</h1>
          <p className="admin-desc">사이트 이름, 검색 결과에 나오는 설명, 저작권 표시를 관리합니다.</p>
        </div>
      </div>

      <div className="editor-block">
        <h3>SITE — 기본 정보</h3>

        <div className="with-preview">
          <div className="field">
            <label>워드마크 — 좌측 상단 로고 글씨</label>
            <input
              value={site.wordmark}
              onChange={(e) => setSite({ ...site, wordmark: e.target.value })}
            />
          </div>
          <SectionPreviewCard caption="모든 페이지 상단 헤더의 로고 글씨입니다.">
            <PageDiagram page="home" highlight={['header']} />
          </SectionPreviewCard>
        </div>

        <div className="with-preview" style={{ marginTop: 24 }}>
          <div className="field">
            <label>브라우저 탭 제목</label>
            <input
              value={site.title}
              onChange={(e) => setSite({ ...site, title: e.target.value })}
            />
          </div>
          <SectionPreviewCard caption="브라우저 탭 · 즐겨찾기에 표시되는 제목입니다. 페이지 안에는 보이지 않습니다.">
            <BrowserTabPreview />
          </SectionPreviewCard>
        </div>

        <div className="with-preview" style={{ marginTop: 24 }}>
          <div className="field">
            <label>검색·공유용 설명 (SEO)</label>
            <textarea
              style={{ minHeight: 80 }}
              value={site.metaDescription}
              onChange={(e) => setSite({ ...site, metaDescription: e.target.value })}
            />
            <span className="hint">
              네이버·구글 검색 결과와 카카오톡 공유 미리보기에 나오는 문장입니다.
            </span>
          </div>
          <SectionPreviewCard caption="페이지 안에는 보이지 않고, 검색 결과와 카카오톡 공유 미리보기에만 나타납니다.">
            <SearchCardPreview />
          </SectionPreviewCard>
        </div>

        <div className="with-preview" style={{ marginTop: 24 }}>
          <div className="field">
            <label>하단 저작권 표시</label>
            <input
              value={site.copyright}
              onChange={(e) => setSite({ ...site, copyright: e.target.value })}
            />
          </div>
          <SectionPreviewCard caption="모든 페이지 맨 아래 Footer에 표시됩니다.">
            <PageDiagram page="home" highlight={['footer']} />
          </SectionPreviewCard>
        </div>

        <div style={{ marginTop: 28 }}>
          <button className="btn" onClick={() => void save()} disabled={saving}>
            {saving ? '저장 중…' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>
    </>
  )
}
