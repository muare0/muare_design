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
--
-- [추가판] 상담글에 첨부한 사진/파일이 상세페이지에 실제로 보이지 않던 문제를
-- 고쳤습니다. 이제 첨부파일 정보(파일명 + 주소 + 사진 여부)가 attachments
-- 라는 전용 칸에 구조화되어 저장되고, 상세페이지/관리자 화면에서 사진은
-- 실제 썸네일로, 그 외 파일은 파일명이 붙은 링크로 보입니다. 이 버전도
-- 다시 한 번 전체 실행하시면 안전하게 반영됩니다.
--
-- [관리자 화면 개선판] 관리자 페이지에서 상담글을 확인할 때, 체크리스트
-- 항목 제목과 방문자가 실제로 입력한 답변이 잘 구분되어 보이도록 answers
-- 라는 전용 칸을 새로 추가했습니다 (섹션 번호/제목 + 항목별 라벨/답변이
-- 구조화된 형태로 저장됩니다). 이 버전도 다시 한 번 전체 실행해 주시면
-- 안전하게 반영됩니다 (예전에 등록된 글은 이 칸이 비어 있으므로, 화면에서는
-- 예전 방식(content)으로 그대로 보여줍니다).
--
-- [글 수정/삭제 추가판] 상담게시판에 작성자 본인이 자기 글을 수정하거나
-- 삭제할 수 있는 기본 게시판 기능을 추가했습니다. 로그인 계정이 따로
-- 없는 게시판이라, 글 작성 시 입력한 비밀번호로 본인 확인을 합니다.
--  - form_data 라는 칸을 새로 추가해서, 수정 화면에 처음 작성했던 체크리스트
--    선택 상태를 그대로 불러올 수 있게 했습니다 (비밀번호는 절대 여기에
--    저장되지 않습니다).
--  - update_consultation() / delete_consultation() 함수가 새로 추가됐고,
--    둘 다 비밀번호가 맞는 경우에만 동작합니다 (security definer 함수 내부에서
--    직접 확인하므로, 일반 방문자 권한으로는 다른 사람 글을 고치거나 지울 수 없습니다).
-- 이 버전도 다시 한 번 전체 실행해 주셔야 수정/삭제 기능이 정상 동작합니다.
--
-- [답변 댓글창 추가판] 답변을 한 번만 남길 수 있던 것을, 댓글창처럼 관리자와
-- 작성자가 여러 번 주고받을 수 있도록 바꿨습니다.
--  - consult_replies 라는 새 테이블에 답변/댓글이 하나씩 쌓입니다 (author 는
--    'admin' 또는 'visitor').
--  - list_consult_replies() / add_consult_reply() 함수가 새로 추가됐습니다.
--    작성자 본인은 비밀번호로 확인한 뒤에만 댓글을 남길 수 있고, 관리자는
--    로그인 계정으로 직접 남깁니다.
--  - 예전에 남겨둔 단일 답변(admin_reply)이 있다면, 이 스크립트를 실행할 때
--    자동으로 댓글창의 첫 번째 답변으로 옮겨줍니다 (중복 실행해도 안전합니다).
-- 이 버전도 다시 한 번 전체 실행해 주셔야 댓글창 기능이 정상 동작합니다.
--
-- [아바타 추가판] 글쓰기 화면에서 미리 준비된 캐릭터 이미지 중 하나를 "나의
-- 이미지"로 고를 수 있게 했습니다.
--  - avatar 라는 칸에 고른 이미지의 아이디(예: female-1, male-3)만 저장됩니다
--    (실제 이미지 파일은 웹사이트에 미리 들어있는 /avatars 폴더 안 그림입니다).
-- 이 버전도 다시 한 번 전체 실행해 주셔야 아바타 기능이 정상 동작합니다.
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
  replied_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  form_data jsonb not null default '{}'::jsonb,
  avatar text not null default ''
);

-- 예전에 이미 테이블을 만들어두신 경우를 위한 보강 (없으면 추가, 있으면 그대로 둠)
alter table consultations add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table consultations add column if not exists answers jsonb not null default '[]'::jsonb;
alter table consultations add column if not exists form_data jsonb not null default '{}'::jsonb;
alter table consultations add column if not exists avatar text not null default '';

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
-- (수정 화면에서 체크리스트를 그대로 불러올 수 있도록 p_form_data 인자가
--  추가되어, 예전 버전의 함수를 먼저 지우고 새로 만듭니다 — 인자 개수가
--  달라지면 그냥 덮어쓰기가 안 됩니다. 바로 이전 버전은 p_answers 까지
--  있는 9개 인자였습니다)
-- ------------------------------------------------------------
drop function if exists submit_consultation(text, text, text, text, text, text, boolean);
drop function if exists submit_consultation(text, text, text, text, text, text, boolean, jsonb);
drop function if exists submit_consultation(text, text, text, text, text, text, boolean, jsonb, jsonb);
drop function if exists submit_consultation(text, text, text, text, text, text, boolean, jsonb, jsonb, jsonb);

create or replace function submit_consultation(
  p_name text,
  p_phone text,
  p_email text,
  p_title text,
  p_content text,
  p_password text,
  p_is_secret boolean,
  p_attachments jsonb default '[]'::jsonb,
  p_answers jsonb default '[]'::jsonb,
  p_form_data jsonb default '{}'::jsonb,
  p_avatar text default ''
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  insert into consultations(name, phone, email, title, content, password_hash, is_secret, attachments, answers, form_data, avatar)
  values (
    p_name, p_phone, p_email, p_title, p_content, crypt(p_password, gen_salt('bf')), p_is_secret,
    coalesce(p_attachments, '[]'::jsonb), coalesce(p_answers, '[]'::jsonb), coalesce(p_form_data, '{}'::jsonb),
    coalesce(p_avatar, '')
  )
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function submit_consultation(text, text, text, text, text, text, boolean, jsonb, jsonb, jsonb, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 글 본문 조회 — 공개글은 비밀번호 없이, 비밀글은 비밀번호가 맞아야 내용이 반환됩니다.
-- (반환값에 form_data 가 추가되어 마찬가지로 먼저 지우고 새로 만듭니다 —
--  수정 화면에 들어갈 때 이 값으로 체크리스트를 그대로 복원합니다)
-- ------------------------------------------------------------
drop function if exists get_consultation(uuid, text);

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
  replied_at timestamptz,
  attachments jsonb,
  answers jsonb,
  form_data jsonb,
  avatar text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select c.id, c.created_at, c.name, c.phone, c.email, c.title, c.content,
           c.is_secret, c.status, c.admin_reply, c.replied_at, c.attachments, c.answers, c.form_data, c.avatar
    from consultations c
    where c.id = p_id
      and (c.is_secret = false or c.password_hash = crypt(p_password, c.password_hash));
end;
$$;

grant execute on function get_consultation(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 글 수정 — 작성 시 입력한 비밀번호가 맞아야만 수정됩니다 (본인 확인).
-- 답변(admin_reply)·상태(status)는 방문자가 손댈 수 없도록 여기서 다루지 않습니다.
-- 비밀번호가 틀리면 아무것도 바꾸지 않고 false 를 돌려줍니다.
-- ------------------------------------------------------------
drop function if exists update_consultation(uuid, text, text, text, text, text, text, boolean, jsonb, jsonb, jsonb);
drop function if exists update_consultation(uuid, text, text, text, text, text, text, boolean, jsonb, jsonb, jsonb, text);

create or replace function update_consultation(
  p_id uuid,
  p_password text,
  p_name text,
  p_phone text,
  p_email text,
  p_title text,
  p_content text,
  p_is_secret boolean,
  p_attachments jsonb default '[]'::jsonb,
  p_answers jsonb default '[]'::jsonb,
  p_form_data jsonb default '{}'::jsonb,
  p_avatar text default ''
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  password_ok boolean;
begin
  select (c.password_hash = crypt(p_password, c.password_hash)) into password_ok
  from consultations c
  where c.id = p_id;

  if password_ok is not true then
    return false;
  end if;

  update consultations set
    name = p_name,
    phone = p_phone,
    email = p_email,
    title = p_title,
    content = p_content,
    is_secret = p_is_secret,
    attachments = coalesce(p_attachments, '[]'::jsonb),
    answers = coalesce(p_answers, '[]'::jsonb),
    form_data = coalesce(p_form_data, '{}'::jsonb),
    avatar = coalesce(p_avatar, '')
  where id = p_id;

  return true;
end;
$$;

grant execute on function update_consultation(uuid, text, text, text, text, text, text, boolean, jsonb, jsonb, jsonb, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 글 삭제 — 작성 시 입력한 비밀번호가 맞아야만 삭제됩니다 (본인 확인).
-- 참고: 첨부파일(스토리지의 실제 파일)은 이 함수가 지우지 않습니다. 글은
-- 바로 지워지지만, 첨부했던 파일은 스토리지에 남아있을 수 있습니다.
-- ------------------------------------------------------------
drop function if exists delete_consultation(uuid, text);

create or replace function delete_consultation(p_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  password_ok boolean;
begin
  select (c.password_hash = crypt(p_password, c.password_hash)) into password_ok
  from consultations c
  where c.id = p_id;

  if password_ok is not true then
    return false;
  end if;

  delete from consultations where id = p_id;
  return true;
end;
$$;

grant execute on function delete_consultation(uuid, text) to anon, authenticated;

-- ============================================================
-- [답변 댓글창] consult_replies — 답변을 댓글처럼 여러 번 주고받을 수 있게
-- 별도 테이블로 분리했습니다. author 가 'admin' 이면 관리자가, 'visitor' 면
-- 작성자 본인이 남긴 댓글입니다.
-- ============================================================

create table if not exists consult_replies (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations(id) on delete cascade,
  author text not null default 'admin' check (author in ('admin', 'visitor')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists consult_replies_consultation_id_idx on consult_replies(consultation_id);

alter table consult_replies enable row level security;

drop policy if exists "consult_replies_select_admin" on consult_replies;
drop policy if exists "consult_replies_insert_admin" on consult_replies;
drop policy if exists "consult_replies_delete_admin" on consult_replies;

-- 관리자는 테이블에 직접 접근합니다 (일반 방문자는 아래 함수를 통해서만 접근).
create policy "consult_replies_select_admin" on consult_replies
  for select to authenticated
  using (exists (select 1 from admins a where a.user_id = auth.uid()));

create policy "consult_replies_insert_admin" on consult_replies
  for insert to authenticated
  with check (
    author = 'admin'
    and exists (select 1 from admins a where a.user_id = auth.uid())
  );

create policy "consult_replies_delete_admin" on consult_replies
  for delete to authenticated
  using (exists (select 1 from admins a where a.user_id = auth.uid()));

revoke all on consult_replies from anon;
grant select, insert, delete on consult_replies to authenticated;

-- ------------------------------------------------------------
-- 댓글 목록 조회 — 공개글은 비밀번호 없이, 비밀글은 비밀번호가 맞아야 보입니다.
-- ------------------------------------------------------------
drop function if exists list_consult_replies(uuid, text);

create or replace function list_consult_replies(p_id uuid, p_password text default '')
returns table (id uuid, author text, content text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select r.id, r.author, r.content, r.created_at
    from consult_replies r
    join consultations c on c.id = r.consultation_id
    where r.consultation_id = p_id
      and (c.is_secret = false or c.password_hash = crypt(p_password, c.password_hash))
    order by r.created_at asc;
end;
$$;

grant execute on function list_consult_replies(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 작성자 본인이 댓글(재답변)을 남깁니다 — 비밀번호가 맞아야만 등록됩니다.
-- 방문자가 댓글을 남기면, 관리자가 다시 확인할 수 있도록 상태를 "답변대기"로
-- 되돌립니다.
-- ------------------------------------------------------------
drop function if exists add_consult_reply(uuid, text, text);

create or replace function add_consult_reply(p_id uuid, p_password text, p_content text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  password_ok boolean;
begin
  select (c.password_hash = crypt(p_password, c.password_hash)) into password_ok
  from consultations c
  where c.id = p_id;

  if password_ok is not true then
    return false;
  end if;

  if p_content is null or trim(p_content) = '' then
    return false;
  end if;

  insert into consult_replies(consultation_id, author, content)
  values (p_id, 'visitor', p_content);

  update consultations set status = '답변대기' where id = p_id;

  return true;
end;
$$;

grant execute on function add_consult_reply(uuid, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 예전에 남겨둔 단일 답변(admin_reply)을 댓글창의 첫 답변으로 옮깁니다.
-- 이미 옮겨진 글은 다시 옮기지 않으므로, 여러 번 실행해도 안전합니다.
-- ------------------------------------------------------------
insert into consult_replies(consultation_id, author, content, created_at)
select c.id, 'admin', c.admin_reply, coalesce(c.replied_at, c.created_at)
from consultations c
where c.admin_reply is not null
  and trim(c.admin_reply) <> ''
  and not exists (
    select 1 from consult_replies r
    where r.consultation_id = c.id and r.author = 'admin' and r.content = c.admin_reply
  );

-- ============================================================
-- [추가] 상담 첨부파일 저장 공간 (consult-uploads 스토리지 버킷)
--
-- 상담글 작성 화면에서 도면 / 손그림 / 현장 사진·동영상 / 디자인 레퍼런스 /
-- 추가 자료를 첨부하면 이 버킷에 올라갑니다. 방문자가 직접 올리는 공간이라
-- (로그인 없이도 상담글을 쓸 수 있어야 하므로) 누구나 업로드는 가능하지만,
-- 지우는 것은 관리자만 할 수 있도록 막아두었습니다.
--
-- 파일 하나당 50MB로 용량을 제한해 두었습니다. 이 스크립트를 이미
-- 실행하셨어도 다시 실행하면 값이 최신으로 갱신되니 안전합니다.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consult-uploads',
  'consult-uploads',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
    'application/pdf',
    'video/mp4', 'video/quicktime', 'video/webm',
    'image/vnd.dwg', 'application/acad', 'application/dxf', 'image/vnd.dxf',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "consult_uploads_insert_anon" on storage.objects;
drop policy if exists "consult_uploads_select_public" on storage.objects;
drop policy if exists "consult_uploads_delete_admin" on storage.objects;

-- 누구나 상담글 작성 중에 첨부파일을 올릴 수 있습니다.
create policy "consult_uploads_insert_anon" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'consult-uploads');

-- 버킷이 공개(public)라 파일 URL로는 누구나 볼 수 있지만, 목록 조회 권한도 열어둡니다.
create policy "consult_uploads_select_public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'consult-uploads');

-- 삭제는 관리자만 가능합니다.
create policy "consult_uploads_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'consult-uploads' and exists (select 1 from admins a where a.user_id = auth.uid()));

-- ============================================================
-- 여기까지 실행하면 끝입니다.
-- 실행 후 사이트에서 /consult/write 페이지에 들어가 체크리스트 작성 → 파일 첨부 →
-- 등록 → 목록/상세 조회까지 한 번씩 테스트해 보세요.
-- ============================================================
