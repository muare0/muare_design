import { useEffect, useState } from 'react'
import { useSiteContent } from '../hooks/useSiteData'
import { saveContent } from '../lib/portfolioService'
import { DEFAULT_CONTENT } from '../content/defaults'
import type { SiteContent } from '../lib/types'
import { PageDiagram, SectionPreviewCard } from './SectionPreview'

/**
 * 홈페이지 문구 편집.
 * 현재 홈페이지에 실제로 들어있는 항목만 그대로 옮겨 놓았습니다.
 * 항목마다 오른쪽에 실제로 어디에 반영되는지 보여주는 작은 구조도를 붙여뒀습니다.
 */
export default function ContentSettings({ onToast }: { onToast: (m: string) => void }) {
  const { content, reload } = useSiteContent()
  const [draft, setDraft] = useState<SiteContent>(content)
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(content), [content])

  function patch<K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...value } }))
  }

  async function save() {
    setSaving(true)
    try {
      await Promise.all(
        (Object.keys(draft) as (keyof SiteContent)[]).map((k) => saveContent(k, draft[k])),
      )
      await reload()
      onToast('홈페이지 문구를 저장했습니다.')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function resetAll() {
    if (!confirm('모든 문구를 처음 상태로 되돌릴까요?')) return
    setDraft(DEFAULT_CONTENT)
    onToast('처음 문구로 되돌렸습니다. 저장을 눌러야 반영됩니다.')
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Content</h1>
          <p className="admin-desc">
            홈페이지에 보이는 문구를 수정합니다. 저장하면 홈페이지에 바로 반영됩니다.
          </p>
        </div>
      </div>

      {/* HERO */}
      <div className="editor-block">
        <h3>HERO — 첫 화면</h3>
        <div className="with-preview">
          <div>
            <div className="editor-grid">
              <div className="field">
                <label>작은 글씨 (스튜디오 이름)</label>
                <input
                  value={draft.hero.eyebrow}
                  onChange={(e) => patch('hero', { eyebrow: e.target.value })}
                />
              </div>
              <div className="field">
                <label>배경 이미지 주소</label>
                <input
                  value={draft.hero.image}
                  onChange={(e) => patch('hero', { image: e.target.value })}
                />
                <span className="hint">
                  기본값은 <code>/images/hero-arch.webp</code> 입니다.
                </span>
              </div>
              <div className="field">
                <label>메인 카피 — 첫 줄</label>
                <input
                  value={draft.hero.titleTop}
                  onChange={(e) => patch('hero', { titleTop: e.target.value })}
                />
              </div>
              <div className="field">
                <label>메인 카피 — 둘째 줄</label>
                <input
                  value={draft.hero.titleBottom}
                  onChange={(e) => patch('hero', { titleBottom: e.target.value })}
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 24 }}>
              <label>서브 문구</label>
              <input
                value={draft.hero.subtitle}
                onChange={(e) => patch('hero', { subtitle: e.target.value })}
              />
            </div>
          </div>
          <SectionPreviewCard caption="홈페이지 맨 위 첫 화면(Hero)의 문구와 배경 이미지에 반영됩니다.">
            <PageDiagram page="home" highlight={['hero']} />
          </SectionPreviewCard>
        </div>

        <h3 style={{ marginTop: 40 }}>HERO — 두 번째 배경 문구</h3>
        <p className="admin-desc">
          두 번째 배경(back2-clean.png)으로 넘어갔을 때 보여줄 문구입니다. 비워두면 첫 번째 문구를
          그대로 씁니다.
        </p>
        <div className="with-preview">
          <div>
            <div className="editor-grid">
              <div className="field">
                <label>작은 글씨 (스튜디오 이름)</label>
                <input
                  value={draft.hero.eyebrow2 || ''}
                  onChange={(e) => patch('hero', { eyebrow2: e.target.value })}
                />
              </div>
              <div className="field">
                <label>메인 카피 — 첫 줄</label>
                <input
                  value={draft.hero.titleTop2 || ''}
                  onChange={(e) => patch('hero', { titleTop2: e.target.value })}
                />
              </div>
              <div className="field">
                <label>메인 카피 — 둘째 줄</label>
                <input
                  value={draft.hero.titleBottom2 || ''}
                  onChange={(e) => patch('hero', { titleBottom2: e.target.value })}
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 24 }}>
              <label>서브 문구</label>
              <input
                value={draft.hero.subtitle2 || ''}
                onChange={(e) => patch('hero', { subtitle2: e.target.value })}
              />
            </div>
          </div>
          <SectionPreviewCard caption="같은 Hero 영역에서, 배경이 두 번째 이미지로 넘어갔을 때 보이는 문구입니다.">
            <PageDiagram page="home" highlight={['hero']} />
          </SectionPreviewCard>
        </div>
      </div>

      {/* ABOUT */}
      <div className="editor-block">
        <h3>ABOUT</h3>
        <div className="with-preview">
          <div>
            <div className="editor-grid">
              <div className="field">
                <label>작은 글씨</label>
                <input
                  value={draft.about.eyebrow}
                  onChange={(e) => patch('about', { eyebrow: e.target.value })}
                />
              </div>
              <div className="field">
                <label>제목</label>
                <input
                  value={draft.about.heading}
                  onChange={(e) => patch('about', { heading: e.target.value })}
                />
              </div>
            </div>
            {draft.about.body.map((p, i) => (
              <div className="field" style={{ marginTop: 24 }} key={i}>
                <label>본문 {i + 1}번째 문단</label>
                <textarea
                  value={p}
                  onChange={(e) => {
                    const body = [...draft.about.body]
                    body[i] = e.target.value
                    patch('about', { body })
                  }}
                />
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                className="btn ghost sm"
                onClick={() => patch('about', { body: [...draft.about.body, ''] })}
              >
                + 문단 추가
              </button>
              {draft.about.body.length > 1 && (
                <button
                  className="btn ghost sm"
                  onClick={() => patch('about', { body: draft.about.body.slice(0, -1) })}
                >
                  마지막 문단 삭제
                </button>
              )}
            </div>
            <div className="field" style={{ marginTop: 24 }}>
              <label>사진주소</label>
              <input
                value={draft.about.image}
                onChange={(e) => patch('about', { image: e.target.value })}
              />
            </div>
          </div>
          <SectionPreviewCard caption="홈페이지 'About' 영역의 소개 글과 사진에 반영됩니다.">
            <PageDiagram page="home" highlight={['about']} />
          </SectionPreviewCard>
        </div>
      </div>

      {/* SERVICE — /service 페이지 맨 위 소개 문구 */}
      <div className="editor-block">
        <h3>SERVICE — 서비스 페이지 소개</h3>
        <p className="admin-desc">
          "서비스 자세히 보기" 로 들어가는 /service 페이지 맨 위 소개 문구입니다. 그 아래
          서비스 대상 · 작업범위 · 작업순서 · 안내사항 등 상세 내용은 코드에 직접 작성되어
          있어 이 화면에서는 관리하지 않습니다.
        </p>
        <div className="with-preview">
          <div>
            <div className="editor-grid">
              <div className="field">
                <label>작은 글씨</label>
                <input
                  value={draft.serviceInfo.eyebrow}
                  onChange={(e) => patch('serviceInfo', { eyebrow: e.target.value })}
                />
              </div>
              <div className="field">
                <label>제목</label>
                <input
                  value={draft.serviceInfo.heading}
                  onChange={(e) => patch('serviceInfo', { heading: e.target.value })}
                />
              </div>
            </div>
            {draft.serviceInfo.intro.map((p, i) => (
              <div className="field" style={{ marginTop: 24 }} key={i}>
                <label>소개 {i + 1}번째 문단</label>
                <textarea
                  value={p}
                  onChange={(e) => {
                    const intro = [...draft.serviceInfo.intro]
                    intro[i] = e.target.value
                    patch('serviceInfo', { intro })
                  }}
                />
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                className="btn ghost sm"
                onClick={() => patch('serviceInfo', { intro: [...draft.serviceInfo.intro, ''] })}
              >
                + 문단 추가
              </button>
              {draft.serviceInfo.intro.length > 1 && (
                <button
                  className="btn ghost sm"
                  onClick={() =>
                    patch('serviceInfo', { intro: draft.serviceInfo.intro.slice(0, -1) })
                  }
                >
                  마지막 문단 삭제
                </button>
              )}
            </div>
          </div>
          <SectionPreviewCard caption={'"서비스 자세히 보기"로 들어가는 /service 페이지 맨 위 소개 문구입니다. 아래 상세 내용은 여기서 관리하지 않습니다.'}>
            <PageDiagram page="service" highlight={['svc-intro']} />
          </SectionPreviewCard>
        </div>
      </div>

      {/* SECTION HEADS */}
      <div className="editor-block">
        <h3>SECTION — 영역 제목</h3>
        <div className="with-preview">
          <div className="editor-grid">
            <div className="field">
              <label>Portfolio 영역 — 작은 글씨</label>
              <input
                value={draft.portfolio.eyebrow}
                onChange={(e) => patch('portfolio', { eyebrow: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Portfolio 영역 — 제목</label>
              <input
                value={draft.portfolio.heading}
                onChange={(e) => patch('portfolio', { heading: e.target.value })}
              />
            </div>
          </div>
          <SectionPreviewCard caption="홈페이지 Portfolio 영역의 제목에 반영됩니다.">
            <PageDiagram page="home" highlight={['portfolio']} />
          </SectionPreviewCard>
        </div>
      </div>

      {/* CONTACT */}
      <div className="editor-block">
        <h3>CONTACT — 연락처</h3>
        <div className="with-preview">
          <div>
            <div className="field">
              <label>제목</label>
              <input
                value={draft.contact.heading}
                onChange={(e) => patch('contact', { heading: e.target.value })}
              />
            </div>
            <div className="field" style={{ marginTop: 24 }}>
              <label>안내 문구</label>
              <input
                value={draft.contact.subtitle}
                onChange={(e) => patch('contact', { subtitle: e.target.value })}
              />
            </div>
          </div>
          <SectionPreviewCard caption="홈페이지 맨 아래 Contact 영역의 제목과 안내 문구입니다.">
            <PageDiagram page="home" highlight={['contact']} />
          </SectionPreviewCard>
        </div>

        <div className="with-preview" style={{ marginTop: 24 }}>
          <div className="editor-grid">
            <div className="field">
              <label>이메일</label>
              <input
                value={draft.contact.email}
                onChange={(e) => patch('contact', { email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>인스타그램 주소</label>
              <input
                value={draft.contact.instagram}
                onChange={(e) => patch('contact', { instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="field">
              <label>카카오 채널 주소</label>
              <input
                value={draft.contact.kakao}
                onChange={(e) => patch('contact', { kakao: e.target.value })}
                placeholder="https://pf.kakao.com/..."
              />
            </div>
          </div>
          <SectionPreviewCard caption={'이메일 · 인스타그램은 Footer의 링크로 쓰입니다. 카카오 주소는 Footer뿐 아니라 Contact 영역의 "카카오톡 상담" 버튼, /service 페이지 하단 버튼에도 함께 쓰입니다.'}>
            <PageDiagram page="home" highlight={['contact', 'footer']} />
          </SectionPreviewCard>
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn" onClick={() => void save()} disabled={saving}>
          {saving ? '저장 중…' : 'SAVE CONTENT'}
        </button>
        <button className="btn ghost" onClick={resetAll}>
          처음 문구로 되돌리기
        </button>
      </div>
    </>
  )
}
