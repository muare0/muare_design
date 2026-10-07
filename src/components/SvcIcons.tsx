/**
 * 서비스 안내 페이지용 라인아트 아이콘 모음입니다.
 * 상세페이지(이미지) 에 쓰인 아이콘과 같은 계열로, 사이트의 얇은 라인 톤에
 * 맞춰 직접 그린 SVG 입니다. 크기와 색은 CSS 로 조절합니다.
 *
 * 사용법:  <GuideIcon name="cube" />
 */
const ICONS: Record<string, JSX.Element> = {
  /* ---- 서비스 대상 ---- */
  // 프로젝트 미팅 · 제안 — 프레젠테이션 화면
  meeting: (
    <>
      <rect x="3" y="4" width="18" height="11.5" rx="1.6" />
      <path d="M12 15.5V19" />
      <path d="M8 21l4-2 4 2" strokeLinejoin="round" />
    </>
  ),
  // 셀프 · 반셀프 인테리어 — 페인트 롤러
  roller: (
    <>
      <rect x="3.2" y="4.2" width="11.2" height="5.6" rx="1.5" />
      <path d="M14.4 7h4.1a1.7 1.7 0 0 1 1.7 1.7v2a1.7 1.7 0 0 1-1.7 1.7h-6.8" strokeLinejoin="round" />
      <rect x="9.9" y="12.4" width="3.6" height="3.1" rx="1" />
      <path d="M11.7 15.5V20.4" />
    </>
  ),
  // 창업 · 공간 연출 — 매장
  store: (
    <>
      <path d="M4.4 10.2V20h15.2v-9.8" strokeLinejoin="round" />
      <path d="M3 10.2l1.7-5.4h14.6L21 10.2z" strokeLinejoin="round" />
      <path d="M9.6 20v-5.6h4.8V20" strokeLinejoin="round" />
    </>
  ),
  // 건축 · 인테리어 전공 — 제도 컴퍼스
  compass: (
    <>
      <circle cx="12" cy="4.4" r="1.7" />
      <path d="M11.1 6.6L6.2 20" />
      <path d="M12.9 6.6L17.8 20" />
      <path d="M9.5 13.6h5" />
    </>
  ),

  /* ---- 작업 범위 ---- */
  // 도면 설계 — 자
  ruler: (
    <>
      <rect x="2.4" y="7.6" width="19.2" height="8.8" rx="1.5" />
      <path d="M6.6 7.6v3.2M10.4 7.6v4.6M14.2 7.6v3.2M18 7.6v4.6" />
    </>
  ),
  // 3D 모델링 — 큐브
  cube: (
    <>
      <path d="M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2z" strokeLinejoin="round" />
      <path d="M12 12.3l8-4.7M12 12.3v8.9M12 12.3L4 7.6" strokeLinejoin="round" />
    </>
  ),
  // 동영상 제작 — 비디오 카메라
  video: (
    <>
      <rect x="2.8" y="6.4" width="13" height="11.2" rx="2" />
      <path d="M15.8 10.6l5.4-2.8v8.4l-5.4-2.8z" strokeLinejoin="round" />
    </>
  ),
  // 사용 프로그램 — 모니터 + 커서
  monitor: (
    <>
      <rect x="2.4" y="4" width="14.4" height="10.8" rx="1.6" />
      <path d="M9.6 14.8v3.4M6.2 18.2h6.8" />
      <path d="M16.6 12.4l5.6 2.4-2.3.9-.9 2.3z" strokeLinejoin="round" />
    </>
  ),

  /* ---- 시각화 단계 ---- */
  // 재질 · 조명 — 팔레트
  palette: (
    <>
      <path
        d="M12 3.2c-5 0-8.8 3.6-8.8 8.2 0 4.3 3.2 7.3 7.2 7.3 1.6 0 2.4-.9 2.4-1.9 0-.6-.3-1-.6-1.4-.3-.4-.5-.8-.5-1.3 0-.9.8-1.6 1.8-1.6h1.7c3 0 5-2 5-5 0-2.9-3.5-4.3-8.2-4.3z"
        strokeLinejoin="round"
      />
      <circle cx="7.6" cy="11.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="7.8" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="8.2" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // 실사 렌더링 — 이미지
  render: (
    <>
      <rect x="2.8" y="4.6" width="18.4" height="14.8" rx="2" />
      <circle cx="8.4" cy="10" r="1.7" />
      <path d="M3.4 17.2l5-4.7 3.4 3 2.7-2.4 6.1 5.1" strokeLinejoin="round" />
    </>
  ),

  /* ---- 자료 / 과정 ---- */
  doc: (
    <>
      <path d="M6.2 3h7.6l4.2 4.2V21H6.2z" strokeLinejoin="round" />
      <path d="M13.8 3v4.2H18" strokeLinejoin="round" />
      <path d="M9.2 12.4h5.6M9.2 15.8h4" />
    </>
  ),
  chat: (
    <>
      <path d="M3.8 5h16.4v10.6H9.6L5.6 19v-3.4H3.8z" strokeLinejoin="round" />
      <path d="M7.8 8.8h8.4M7.8 12h5.4" />
    </>
  ),
  calc: (
    <>
      <rect x="4.6" y="2.8" width="14.8" height="18.4" rx="2" />
      <rect x="7.6" y="5.8" width="8.8" height="3.2" rx="0.9" />
      <circle cx="8.8" cy="13" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="13" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="8.8" cy="17" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="17" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  clipboard: (
    <>
      <path d="M8.4 4.6H6.6A1.6 1.6 0 0 0 5 6.2v13.2A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.6-1.6V6.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" strokeLinejoin="round" />
      <rect x="8.4" y="2.9" width="7.2" height="3.4" rx="1.1" />
      <path d="M9.3 13.4l2.2 2.2 4.2-4.5" strokeLinejoin="round" />
    </>
  ),
  refresh: (
    <>
      <path d="M4.6 11.6a7.4 7.4 0 0 1 12.7-5.2V3" />
      <path d="M17.3 6.4h-3.6" strokeLinejoin="round" />
      <path d="M19.4 12.4a7.4 7.4 0 0 1-12.7 5.2V21" />
      <path d="M6.7 17.6h3.6" strokeLinejoin="round" />
    </>
  ),
  filecheck: (
    <>
      <path d="M6.2 3h7.6l4.2 4.2V21H6.2z" strokeLinejoin="round" />
      <path d="M13.8 3v4.2H18" strokeLinejoin="round" />
      <path d="M9 13.6l2.2 2.2 4-4.4" strokeLinejoin="round" />
    </>
  ),

  /* ---- 사용 프로그램 ---- */
  // Photoshop — 레이어
  layers: (
    <>
      <path d="M12 3.4l8.2 4.3L12 12l-8.2-4.3z" strokeLinejoin="round" />
      <path d="M3.8 12.3L12 16.6l8.2-4.3" strokeLinejoin="round" />
      <path d="M3.8 16.6L12 20.9l8.2-4.3" strokeLinejoin="round" />
    </>
  ),
  // Illustrator — 펜 도구
  pen: (
    <>
      <path
        d="M4 20l4.2-1.2L18.8 8.2a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5.2 15.8z"
        strokeLinejoin="round"
      />
      <path d="M4 20l1.2-4.2" strokeLinejoin="round" />
      <circle cx="15.4" cy="8.6" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  /* ---- 안내사항 ---- */
  mail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
      <path d="M3.6 6.6l8.4 6.2 8.4-6.2" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.6V12l3.7 2.3" strokeLinejoin="round" />
    </>
  ),
  copyright: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M15.1 9.4a4 4 0 1 0 0 5.2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M7.9 12.2l2.8 2.8 5.4-5.6" strokeLinejoin="round" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3.4L21.6 20.2H2.4z" strokeLinejoin="round" />
      <path d="M12 9.4v4.9" />
      <circle cx="12" cy="17.2" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
}

export function GuideIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {ICONS[name] ?? <circle cx="12" cy="12" r="8.5" />}
    </svg>
  )
}

export default GuideIcon
