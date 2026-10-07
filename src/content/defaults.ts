import type { SiteContent, DesignTokens, Portfolio } from '../lib/types'

/**
 * 현재 홈페이지에 들어있던 문구를 그대로 옮겨둔 기본값입니다.
 * Supabase 에 값이 없거나 연결 전이어도 홈페이지는 이 내용으로 정상 표시됩니다.
 * ⚠️ 이 파일의 문구는 브랜드 카피이므로 임의로 바꾸지 마세요.
 *    (변경은 관리자 페이지의 Content 메뉴에서 하시면 됩니다.)
 */
export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: 'Muare Design Studio',
    titleTop: 'Aesthetic,',
    titleBottom: 'with a reason.',
    subtitle: '아름다움에는 이유가 있다 — 브랜드와 공간의 본질을 시각적으로 해석합니다.',
    image: '/images/hero-arch.webp',
    eyebrow2: 'Muare Design Studio',
    titleTop2: 'Detail,',
    titleBottom2: 'makes the whole.',
    subtitle2: '보이지 않는 곳까지 헤아리는 디테일이 브랜드와 공간의 완성도를 만듭니다.',
  },
  about: {
    eyebrow: 'Designer',
    heading: '왜 아름다워야 하는가',
    body: [
      '뮤아르 디자인 스튜디오는 예쁜 것을 만드는 일과, 아름다운 것을 만드는 일이 다르다고 믿습니다. 좋은 디자인은 취향의 나열이 아니라 브랜드가 가진 본질을 읽어내는 일에서 시작됩니다.',
      '트렌드를 따르되 거기에 머무르지 않고, 클라이언트의 이야기를 시각 언어로 정제하는 것을 가장 중요한 원칙으로 삼습니다. 아름다움과 기능 사이의 균형을 찾는 과정이 곧 저희의 작업입니다.',
    ],
    image: '/images/designer.webp',
    imageAlt: '뮤아르 디자인 스튜디오 디자이너',
  },
  /**
   * /service 페이지 맨 위 소개 문구만 관리합니다. 그 아래 상세 내용(서비스 대상 ·
   * 작업범위 · 작업순서 · 안내사항 등)은 src/content/serviceGuide.ts 에 있습니다.
   */
  serviceInfo: {
    eyebrow: 'Service',
    heading: '뮤아르디자인스튜디오의 작업 방식',
    intro: [
      '뮤아르디자인스튜디오는 감각적인 공간 디자인을 기반으로, 건축·인테리어·전시·상업공간 전반에 걸친 다양한 프로젝트를 진행합니다.',
      '건축 조감도, 3D 인테리어 투시도, 아이소메트릭 등 시각화 작업을 통해 아이디어를 보다 선명하고 설득력 있게 표현합니다.',
      '합리적인 비용과 신속한 진행, 그리고 지속적인 소통과 꼼꼼한 검수로 완성도를 높이며 오랜 파트너십으로 이어질 수 있는 관계를 만들어갑니다.',
    ],
  },
  portfolio: { eyebrow: 'Portfolio', heading: 'MUARE Design Works' },
  contact: {
    heading: "Let's create something beautiful.",
    subtitle: '프로젝트 문의는 아래 버튼을 통해 남겨주세요.',
    email: 'hello@muare-design.com',
    instagram: '',
    kakao: 'https://pf.kakao.com/_AkFen',
  },
  site: {
    wordmark: 'MUARE',
    title: '뮤아르 디자인 스튜디오 | Muare Design Studio',
    metaDescription:
      '뮤아르 디자인 스튜디오는 브랜드와 공간의 본질을 시각적으로 해석하는 디자인 스튜디오입니다. Aesthetic, with a reason.',
    copyright: '© 2026 Muare Design Studio. All rights reserved.',
  },
}

/** 원본 HTML 의 :root 변수와 동일합니다 */
export const DEFAULT_DESIGN: DesignTokens = {
  '--bg': '#F3EDE4',
  '--bg-deep': '#211E1B',
  '--text': '#211E1B',
  '--text-soft': '#8A8074',
  '--wood': '#B08D5B',
  '--terracotta': '#A8785A',
  '--line': '#DED3C1',
  '--font-heading': "'Cormorant', serif",
  '--font-body': "'Pretendard Variable','Inter',sans-serif",
  '--heading-scale': '1',
  '--body-size': '16px',
  '--letter-spacing': '0em',
}

/**
 * 아직 포트폴리오를 한 건도 등록하지 않았을 때 보여줄 자리표시 목록입니다.
 * 원본 HTML 에 있던 6개 항목의 제목/카테고리를 그대로 유지했습니다.
 * 관리자에서 실제 프로젝트를 1개라도 등록하면 이 목록은 사라집니다.
 */
export const PLACEHOLDER_PORTFOLIOS: Portfolio[] = [
  ['Atelier N°01', 'Brand Identity'],
  ['Maison Forme', 'Editorial Design'],
  ['Aube', 'Visual Identity'],
  ['Object 03', 'Packaging'],
  ['Morrow', 'Brand Design'],
  ['Archive 01', 'Graphic Design'],
].map(([title, category], i) => ({
  id: `placeholder-${i + 1}`,
  slug: null,
  title,
  title_en: null,
  category,
  year: '2026',
  client: null,
  role: null,
  description: null,
  cover_image_id: null,
  published: true,
  featured: false,
  sort_order: i,
  images: [],
}))
