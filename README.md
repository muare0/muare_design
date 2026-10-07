# Muare Design Studio

브랜드 홈페이지 + 디자이너용 포트폴리오 관리 시스템(CMS)

---

## 1. 폴더에 뭐가 들어있나요

| 위치 | 하는 일 |
|---|---|
| `index.html` | 브라우저가 가장 먼저 읽는 파일 (폰트·검색용 설명이 들어있음) |
| `public/images/` | 홈페이지 기본 사진 (아치 인테리어, 디자이너 사진) |
| `src/components/` | 홈페이지 화면 조각들 (Hero, About, Service, Portfolio…) |
| `src/pages/` | 홈 화면(`Home`)과 포트폴리오 전체보기 화면(`Work`) |
| `src/admin/` | 관리자 페이지 전체 |
| `src/lib/` | Supabase 연결, 이미지 처리, 데이터 저장 로직 |
| `src/content/defaults.ts` | **현재 홈페이지의 문구 원본** (Supabase가 비어 있어도 이 내용이 보임) |
| `src/styles/site.css` | 홈페이지 디자인 (기존 CSS 그대로 + 상세/갤러리 스타일 추가) |
| `src/styles/admin.css` | 관리자 화면 디자인 |
| `supabase/schema.sql` | 데이터베이스 설계도 — Supabase에서 한 번 실행 |
| `supabase/seed.sql` | 현재 홈페이지 문구를 데이터베이스에 넣어주는 파일 |

---

## 2. 내 컴퓨터에서 실행하기

```bash
npm install     # 처음 한 번만
npm run dev     # 실행 → http://localhost:5173
```

`npm run build` 로 배포용 파일을 만들 수 있습니다.

> Supabase를 연결하지 않아도 홈페이지는 정상적으로 보입니다.
> (기존 문구 + 예시 포트폴리오 6개가 표시되고, 화면 왼쪽 아래에 안내가 뜹니다.)

---

## 3. 관리자 페이지

주소 뒤에 `/admin` 을 붙이면 됩니다.

- 내 컴퓨터: `http://localhost:5173/admin`
- 배포 후: `https://muare-design.com/admin`

로그인하지 않으면 자동으로 로그인 화면이 나옵니다.

---

## 4. Supabase 준비 (한 번만)

1. [supabase.com](https://supabase.com) 가입 → **New project** (Region은 `Northeast Asia (Seoul)` 추천)
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용 전체 붙여넣고 **Run**
3. 같은 곳에서 `supabase/seed.sql` 도 **Run** (현재 홈페이지 문구가 들어갑니다)
4. **Authentication → Users → Add user** 로 여자친구 계정 생성 (이메일 + 비밀번호)
5. SQL Editor 에서 그 계정을 관리자로 등록:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = '여기에_이메일';
```

6. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사
7. 프로젝트 폴더에 `.env` 파일을 만들고:

```
VITE_SUPABASE_URL=복사한_URL
VITE_SUPABASE_ANON_KEY=복사한_anon_키
```

> ⚠️ `service_role` 키는 절대 넣지 마세요. 이 키는 브라우저에 노출되면 안 됩니다.
> `.env` 파일은 `.gitignore`에 등록되어 있어 GitHub에 올라가지 않습니다.

---

## 5. Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다
2. [vercel.com](https://vercel.com) → **Add New → Project** → 저장소 선택
3. Framework는 **Vite** 로 자동 인식됩니다 (그대로 두면 됨)
4. **Environment Variables** 에 위 `.env` 의 두 값을 그대로 입력
5. **Deploy**

`vercel.json` 이 이미 들어있어서 `/admin` 같은 주소도 새로고침 시 정상 동작합니다.

### 도메인 연결

Vercel 프로젝트 → **Settings → Domains** → `muare-design.com` 입력 →
안내되는 DNS 레코드를 도메인 구입처(가비아·후이즈 등) 관리 화면에 등록하면 됩니다.

---

## 6. 포트폴리오 올리는 법 (디자이너용)

```
/admin 접속 → 로그인
   ↓
+ ADD PROJECT
   ↓
제목 · 분류 · 연도 · 설명 입력
   ↓
이미지 품질 선택 (최고 화질 / 고화질 / 웹 최적화)
   ↓
+ Add Images — 사진 여러 장 한 번에 선택
   ↓
마음에 드는 사진에 '대표로' 눌러 대표 이미지 지정
   ↓
손잡이(⠿)를 끌어서 사진 순서 정리
   ↓
저장하고 공개하기
   ↓
홈페이지 Portfolio에 바로 반영됨
```

### 이미지 품질에 대해

어떤 품질을 고르든 **원본 사진은 손상 없이 그대로 보관**됩니다.
품질 설정은 홈페이지에 보여줄 이미지에만 적용되며, 원본은 관리자 화면에서
언제든 '원본' 버튼으로 다시 내려받을 수 있습니다.

| 선택 | 홈페이지 표시용 최대 크기 | 언제 쓰나 |
|---|---|---|
| 최고 화질 | 3,200px | 디테일이 중요한 작품 |
| 고화질 | 2,400px | 대부분의 경우 (기본값) |
| 웹 최적화 | 1,800px | 사진이 아주 많을 때 |

각 사진은 자동으로 세 가지로 저장됩니다.

```
portfolio-images/
  <프로젝트 id>/
      original/   ← 원본 그대로 (보존용)
      web/        ← 상세 페이지용 고화질 WebP
      thumb/      ← 목록용 가벼운 WebP
```

---

## 7. 그 외 관리 메뉴

- **Content** — Hero 카피, About 소개글, Service 5개 항목, Contact 연락처 수정
- **Design** — 색상·서체·글자 크기 조절 (바꾸는 즉시 미리보기에 반영, 언제든 되돌리기 가능)
- **Site Settings** — 사이트 제목, 검색용 설명, 저작권 표시, Journal 항목

---

## 8. 보안

- 방문자는 **공개(published)된 포트폴리오만** 읽을 수 있습니다
- 등록·수정·삭제·이미지 업로드는 `admins` 테이블에 등록된 계정만 가능합니다
- 이 규칙은 데이터베이스(RLS) 수준에서 강제되므로, 브라우저에서 우회할 수 없습니다
