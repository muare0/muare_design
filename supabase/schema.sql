-- =====================================================================
--  MUARE DESIGN STUDIO — Supabase schema
--  Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run 하세요.
--  (한 번만 실행하면 됩니다. 여러 번 실행해도 안전하도록 작성되어 있습니다.)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 0. 관리자 판별
--    관리자로 쓸 계정을 Auth > Users 에서 만든 뒤, 아래 admins 테이블에
--    그 계정의 uid 를 넣으면 관리자가 됩니다.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 1. 포트폴리오 프로젝트
-- ---------------------------------------------------------------------
create table if not exists public.portfolios (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  title         text not null,
  title_en      text,
  category      text,
  year          text,
  client        text,
  role          text,
  description   text,
  cover_image_id uuid,                       -- portfolio_images.id (아래에서 FK 연결)
  published     boolean not null default false,
  featured      boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 프로젝트 이미지 (한 프로젝트에 여러 장)
--    원본 / 웹표시용 / 썸네일 3종 경로를 각각 보관합니다.
-- ---------------------------------------------------------------------
create table if not exists public.portfolio_images (
  id             uuid primary key default gen_random_uuid(),
  portfolio_id   uuid not null references public.portfolios(id) on delete cascade,

  -- Storage 경로 (bucket: portfolio-images)
  storage_path       text not null,          -- 웹 표시용 (WebP)
  thumb_path         text,                   -- 목록/썸네일용 (작은 WebP)
  original_path      text,                   -- 보존용 원본 (다운로드 대비)

  -- 공개 URL 캐시 (public 버킷일 때)
  image_url          text not null,
  thumb_url          text,

  -- 메타데이터
  quality        text not null default 'high'
                 check (quality in ('max','high','web')),
  width          integer,
  height          integer,
  bytes          integer,
  original_bytes integer,
  original_name  text,
  alt            text,
  caption        text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- 대표 이미지 FK (순환 참조라 테이블 생성 후 연결)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'portfolios_cover_image_fk'
  ) then
    alter table public.portfolios
      add constraint portfolios_cover_image_fk
      foreign key (cover_image_id)
      references public.portfolio_images(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_portfolio_images_portfolio
  on public.portfolio_images(portfolio_id, sort_order);
create index if not exists idx_portfolios_published
  on public.portfolios(published, sort_order);
create index if not exists idx_portfolios_slug
  on public.portfolios(slug);

-- ---------------------------------------------------------------------
-- 3. 사이트 콘텐츠 (Hero / About / Service / Contact 문구)
--    key-value 구조라 나중에 항목이 늘어도 마이그레이션이 필요 없습니다.
-- ---------------------------------------------------------------------
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. 디자인 설정 (CSS 변수로 그대로 주입됩니다)
-- ---------------------------------------------------------------------
create table if not exists public.site_design (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. 저널 (Design Note)
-- ---------------------------------------------------------------------
create table if not exists public.journal_posts (
  id         uuid primary key default gen_random_uuid(),
  kind       text,                            -- Design Note / Inspiration / Project Story
  title      text not null,
  body       text,
  link       text,
  published  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. updated_at 자동 갱신
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_portfolios_touch on public.portfolios;
create trigger trg_portfolios_touch before update on public.portfolios
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_journal_touch on public.journal_posts;
create trigger trg_journal_touch before update on public.journal_posts
  for each row execute function public.touch_updated_at();

-- =====================================================================
--  RLS — 방문자는 "공개된 것만 읽기", 관리자는 전부 가능
-- =====================================================================
alter table public.portfolios       enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.site_content     enable row level security;
alter table public.site_design      enable row level security;
alter table public.journal_posts    enable row level security;
alter table public.admins           enable row level security;

-- portfolios
drop policy if exists "public read published portfolios" on public.portfolios;
create policy "public read published portfolios" on public.portfolios
  for select using (published = true or public.is_admin());

drop policy if exists "admin write portfolios" on public.portfolios;
create policy "admin write portfolios" on public.portfolios
  for all using (public.is_admin()) with check (public.is_admin());

-- portfolio_images
drop policy if exists "public read images of published" on public.portfolio_images;
create policy "public read images of published" on public.portfolio_images
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.portfolios p
      where p.id = portfolio_images.portfolio_id and p.published = true
    )
  );

drop policy if exists "admin write images" on public.portfolio_images;
create policy "admin write images" on public.portfolio_images
  for all using (public.is_admin()) with check (public.is_admin());

-- site_content / site_design / journal — 읽기는 전체 공개
drop policy if exists "public read content" on public.site_content;
create policy "public read content" on public.site_content for select using (true);
drop policy if exists "admin write content" on public.site_content;
create policy "admin write content" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read design" on public.site_design;
create policy "public read design" on public.site_design for select using (true);
drop policy if exists "admin write design" on public.site_design;
create policy "admin write design" on public.site_design
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read journal" on public.journal_posts;
create policy "public read journal" on public.journal_posts
  for select using (published = true or public.is_admin());
drop policy if exists "admin write journal" on public.journal_posts;
create policy "admin write journal" on public.journal_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- admins 테이블은 본인 행만 읽기 (관리자 여부 확인용)
drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row" on public.admins
  for select using (user_id = auth.uid());

-- =====================================================================
--  STORAGE — portfolio-images 버킷
--  ※ 버킷은 대시보드 Storage 화면에서 먼저 만들어 주세요.
--     이름: portfolio-images   /   Public bucket: 체크(ON)
--  아래는 그 버킷의 접근 정책입니다.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read portfolio images" on storage.objects;
create policy "public read portfolio images" on storage.objects
  for select using (bucket_id = 'portfolio-images');

drop policy if exists "admin upload portfolio images" on storage.objects;
create policy "admin upload portfolio images" on storage.objects
  for insert with check (bucket_id = 'portfolio-images' and public.is_admin());

drop policy if exists "admin update portfolio images" on storage.objects;
create policy "admin update portfolio images" on storage.objects
  for update using (bucket_id = 'portfolio-images' and public.is_admin());

drop policy if exists "admin delete portfolio images" on storage.objects;
create policy "admin delete portfolio images" on storage.objects
  for delete using (bucket_id = 'portfolio-images' and public.is_admin());
