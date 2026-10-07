import type { ReactNode } from 'react'

/**
 * 관리자 화면에서 문구를 고칠 때, 그게 실제로 사이트 어느 부분에 반영되는지
 * 오른쪽에 작은 구조도로 보여주기 위한 컴포넌트 모음입니다.
 * 실제 화면을 그대로 캡처한 게 아니라 "구조만 간단히 보여주는 다이어그램"이라
 * 디자인이 바뀌어도 따로 갱신할 필요가 없습니다.
 */

type HomeSectionId = 'header' | 'hero' | 'about' | 'targets' | 'portfolio' | 'contact' | 'footer'
type ServiceSectionId = 'svc-header' | 'svc-intro' | 'svc-jumpnav' | 'svc-detail'

const HOME_LAYOUT: { id: HomeSectionId; label: string; h: number; muted?: boolean }[] = [
  { id: 'header', label: '헤더', h: 20 },
  { id: 'hero', label: 'Hero — 첫 화면', h: 60 },
  { id: 'about', label: 'About', h: 44 },
  { id: 'targets', label: '서비스 대상 카드 (코드로 관리)', h: 34, muted: true },
  { id: 'portfolio', label: 'Portfolio', h: 44 },
  { id: 'contact', label: 'Contact', h: 44 },
  { id: 'footer', label: 'Footer', h: 26 },
]

const SERVICE_LAYOUT: { id: ServiceSectionId; label: string; h: number; muted?: boolean }[] = [
  { id: 'svc-header', label: '헤더', h: 20 },
  { id: 'svc-intro', label: 'Service 소개 (맨 위)', h: 60 },
  { id: 'svc-jumpnav', label: '섹션 네비게이터', h: 20 },
  { id: 'svc-detail', label: '상세 내용 (코드로만 관리)', h: 120, muted: true },
]

/** 홈페이지 또는 /service 페이지의 구조를 위에서 아래로 쌓아 보여주고, 해당 항목을 강조합니다 */
export function PageDiagram({
  page,
  highlight,
}: {
  page: 'home' | 'service'
  highlight: string[]
}) {
  const layout = page === 'home' ? HOME_LAYOUT : SERVICE_LAYOUT
  return (
    <div className="preview-page">
      {layout.map((b) => {
        const active = highlight.includes(b.id)
        return (
          <div
            key={b.id}
            className={`preview-block${active ? ' active' : ''}${b.muted ? ' muted' : ''}`}
            style={{ flexBasis: b.h }}
          >
            {b.label}
          </div>
        )
      })}
    </div>
  )
}

/** 브라우저 탭에 표시되는 제목 — 페이지 안에는 보이지 않는다는 걸 보여주기 위한 목업 */
export function BrowserTabPreview() {
  return (
    <div className="preview-tab-mock">
      <div className="preview-tab-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <div className="preview-tab-chip">탭 제목이 여기에</div>
      </div>
      <div className="preview-tab-page" />
    </div>
  )
}

/** 검색 결과 · 카카오톡 공유 미리보기에만 나타나는 설명 문구를 보여주는 목업 */
export function SearchCardPreview() {
  return (
    <div className="preview-search-card">
      <div className="preview-search-title">뮤아르 디자인 스튜디오</div>
      <div className="preview-search-url">muare-design.com</div>
      <div className="preview-search-desc">설명 문구가 여기에 표시됩니다</div>
    </div>
  )
}

export function SectionPreviewCard({
  children,
  caption,
}: {
  children: ReactNode
  caption: string
}) {
  return (
    <aside className="section-preview">
      {children}
      <p className="section-preview-caption">{caption}</p>
    </aside>
  )
}
