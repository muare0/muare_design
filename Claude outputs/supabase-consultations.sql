-- ============================================================
-- 뮤아르 디자인 스튜디오 — 상담게시판(consultations) 설정 스크립트
--
-- 사용 방법:
--   1) Supabase 대시보드 접속 → 좌측 메뉴에서 "SQL Editor" 클릭
--   2) "New query" 로 새 쿼리 화면을 연 다음, 이 파일 내용을 전체 복사해서 붙여넣기
--   3) 우측 하단 "Run" 버튼 클릭 (딱 한 번만 실행하면 됩니다)
--
-- 이 스크립트는 이미 실행했더라도 다시 실행해도 안전하도록 만들어져 있습니다.
--
-- [수정판] 처음 버전은 "function gen_salt(unknown) does not exist" 오류가 나는
-- 문제가 있었습니다 (Supabase 프로젝트는 pgcrypto 확장을 public 이 아니라
-- extensions 스키마에 설치해두는 경우가 많은데, 처음 버전은 그걸 고려하지
-- 않았습니다). 이 버전은 그 문제를 고쳤습니다 — 이미 한 번 실행하셨어도
-- 이 버전을 다시 한 번 전체 실행해 주시면 됩니다 (안전하게 재실행 가능합니다).
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text,
  email text,
  title text not null,
  content text not null,
  password_hash text not null,
  is_secret boolean not null default true,
  status text not null default '답변대기',
  admin_reply text,
  replied_at timestamptz
);

alter table consultations enable row level security;

-- 재실행 시 충돌하지 않도록 기존 정책을 먼저 정리합니다
drop policy if exists "consultations_select_list_anon" on consultations;
drop policy if exists "consultations_update_admin" on consultations;
drop policy if exists "consultations_delete_admin" on consultations;

-- 누구나 목록(제목/이름/날짜/상태 등 메타 정보)을 볼 수 있습니다.
-- 실제 본문과 비밀번호는 이 정책과 별개로 컬럼 권한에서 막아둡니다 (아래 grant/revoke 참고).
create policy "consultations_select_list_anon" on consultations
  for select to anon, authenticated
  using (true);

-- 관리자(admins 테이블에 등록된 계정)만 답변을 남기거나 상태를 바꾸거나 글을 지울 수 있습니다.
create policy "consultations_update_admin" on consultations
  for update to authenticated
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

create policy "consultations_delete_admin" on consultations
  for delete to authenticated
  using (exists (select 1 from admins a where a.user_id = auth.uid()));

-- 컬럼 단위 권한 정리
--  - 일반 방문자(anon): 목록에 필요한 컬럼만 읽을 수 있고, 본문/비밀번호는 절대 못 읽습니다.
--    새 글 작성은 아래 submit_consultation() 함수를 통해서만 가능합니다.
--  - 로그인한 관리자(authenticated): 모든 컬럼을 읽을 수 있고, 답변/상태만 수정할 수 있습니다.
revoke insert, update, delete on consultations from anon;
revoke select on consultations from anon;
grant select (id, created_at, name, title, is_secret, status) on consultations to anon;

revoke insert on consultations from authenticated;
grant select on consultations to authenticated;
grant update (admin_reply, status, replied_at) on consultations to authenticated;
grant delete on consultations to authenticated;

-- ------------------------------------------------------------
-- 새 글 등록 — 비밀번호는 여기서 해시로 변환되어 저장되며, 평문으로는 절대 저장되지 않습니다.
-- ------------------------------------------------------------
create or replace function submit_consultation(
  p_name text,
  p_phone text,
  p_email text,
  p_title text,
  p_content text,
  p_password text,
  p_is_secret boolean
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  insert into consultations(name, phone, email, title, content, password_hash, is_secret)
  values (p_name, p_phone, p_email, p_title, p_content, crypt(p_password, gen_salt('bf')), p_is_secret)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function submit_consultation(text, text, text, text, text, text, boolean) to anon, authenticated;

-- ------------------------------------------------------------
-- 글 본문 조회 — 공개글은 비밀번호 없이, 비밀글은 비밀번호가 맞아야 내용이 반환됩니다.
-- ------------------------------------------------------------
create or replace function get_consultation(p_id uuid, p_password text default '')
returns table (
  id uuid,
  created_at timestamptz,
  name text,
  phone text,
  email text,
  title text,
  content text,
  is_secret boolean,
  status text,
  admin_reply text,
  replied_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select c.id, c.created_at, c.name, c.phone, c.email, c.title, c.content,
           c.is_secret, c.status, c.admin_reply, c.replied_at
    from consultations c
    where c.id = p_id
      and (c.is_secret = false or c.password_hash = crypt(p_password, c.password_hash));
end;
$$;

grant execute on function get_consultation(uuid, text) to anon, authenticated;

-- ============================================================
-- 여기까지 실행하면 끝입니다.
-- 실행 후 사이트에서 /consult 페이지에 들어가 글쓰기 → 조회까지 한 번 테스트해 보세요.
-- ============================================================
