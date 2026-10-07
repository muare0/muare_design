-- =====================================================================
--  MUARE DESIGN STUDIO — 초기 데이터
--  schema.sql 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에서 Run 하세요.
--  현재 홈페이지에 들어있는 문구를 그대로 옮겨 담습니다.
--  (이걸 실행하지 않아도 홈페이지는 코드 안의 기본값으로 정상 표시됩니다.)
-- =====================================================================

insert into public.site_content (key, value) values
('hero', jsonb_build_object(
  'eyebrow',  'Muare Design Studio',
  'titleTop', 'Aesthetic,',
  'titleBottom', 'with a reason.',
  'subtitle', '아름다움에는 이유가 있다 — 브랜드와 공간의 본질을 시각적으로 해석합니다.',
  'image',    '/images/hero-arch.webp'
)),
('about', jsonb_build_object(
  'eyebrow', 'Designer',
  'heading', '왜 아름다워야 하는가',
  'body', jsonb_build_array(
     '뮤아르 디자인 스튜디오는 예쁜 것을 만드는 일과, 아름다운 것을 만드는 일이 다르다고 믿습니다. 좋은 디자인은 취향의 나열이 아니라 브랜드가 가진 본질을 읽어내는 일에서 시작됩니다.',
     '트렌드를 따르되 거기에 머무르지 않고, 클라이언트의 이야기를 시각 언어로 정제하는 것을 가장 중요한 원칙으로 삼습니다. 아름다움과 기능 사이의 균형을 찾는 과정이 곧 저희의 작업입니다.'
  ),
  'image', '/images/designer.webp',
  'imageAlt', '뮤아르 디자인 스튜디오 디자이너'
)),
('service', jsonb_build_object(
  'eyebrow', 'Service — 다섯 가지 방식으로',
  'heading', '본질을 시각화합니다',
  'items', jsonb_build_array(
    jsonb_build_object('name','Brand Design','desc','브랜드 아이덴티티와 비주얼 시스템을 설계합니다. 로고, 컬러, 톤앤매너까지 일관된 언어로 정리합니다.'),
    jsonb_build_object('name','Graphic Design','desc','브랜드와 콘텐츠를 위한 그래픽 작업을 진행합니다. 포스터, 패키지, SNS 비주얼 등을 다룹니다.'),
    jsonb_build_object('name','Editorial Design','desc','브로슈어, 리플렛, 카탈로그 등 인쇄물의 편집 디자인을 전문적으로 다룹니다.'),
    jsonb_build_object('name','Visual Design','desc','공간과 다양한 매체를 아우르는 비주얼 디자인으로 브랜드 경험을 확장합니다.'),
    jsonb_build_object('name','Custom Design','desc','클라이언트의 목적과 상황에 맞춘 맞춤형 프로젝트를 진행합니다.')
  )
)),
('portfolio', jsonb_build_object(
  'eyebrow', 'Portfolio',
  'heading', 'Selected works'
)),
('journal', jsonb_build_object(
  'eyebrow', 'Journal',
  'heading', 'Design Note'
)),
('contact', jsonb_build_object(
  'heading',  'Let''s create something beautiful.',
  'subtitle', '프로젝트 문의는 아래 버튼을 통해 남겨주세요.',
  'buttonLabel', 'Project Inquiry',
  'email',     'hello@muare-design.com',
  'instagram', '',
  'kakao',     ''
)),
('site', jsonb_build_object(
  'wordmark', 'MUARE',
  'title',    '뮤아르 디자인 스튜디오 | Muare Design Studio',
  'metaDescription', '뮤아르 디자인 스튜디오는 브랜드와 공간의 본질을 시각적으로 해석하는 디자인 스튜디오입니다. Aesthetic, with a reason.',
  'copyright','© 2026 Muare Design Studio. All rights reserved.'
))
on conflict (key) do nothing;

insert into public.site_design (key, value) values
  ('--bg',        '#F3EDE4'),
  ('--bg-deep',   '#211E1B'),
  ('--text',      '#211E1B'),
  ('--text-soft', '#8A8074'),
  ('--wood',      '#B08D5B'),
  ('--terracotta','#A8785A'),
  ('--line',      '#DED3C1'),
  ('--font-heading', '''Cormorant'', serif'),
  ('--font-body',    '''Pretendard Variable'',''Inter'',sans-serif'),
  ('--heading-scale','1'),
  ('--body-size',    '16px'),
  ('--letter-spacing','0em')
on conflict (key) do nothing;

insert into public.journal_posts (kind, title, sort_order) values
  ('Design Note',   '아름다움은 어디에서 시작되는가', 1),
  ('Inspiration',   '좋은 브랜드는 왜 여백을 필요로 하는가', 2),
  ('Project Story', '하나의 색을 선택하는 과정', 3)
on conflict do nothing;
