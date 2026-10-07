import { supabase } from './supabase'

/**
 * 상담게시판 (consultations 테이블) 관련 함수 모음.
 *
 * ⚠️ 이 기능을 쓰려면 Supabase 프로젝트에 consultations 테이블과
 *    submit_consultation / get_consultation 함수, 그리고 상담 첨부파일을 위한
 *    consult-uploads 스토리지 버킷이 먼저 만들어져 있어야 합니다.
 *    같이 전달드린 supabase-consultations.sql 파일을 Supabase 대시보드의
 *    SQL Editor 에서 한 번 실행해 주세요. (이미 실행하셨더라도 다시 실행해도 안전합니다.)
 */

export interface ConsultListItem {
  id: string
  created_at: string
  name: string
  title: string
  is_secret: boolean
  status: string
}

/** 상담글에 첨부된 파일 한 개 (도면 / 손그림 / 현장 사진·동영상 / 레퍼런스 / 추가 자료 공통) */
export interface ConsultAttachment {
  /** 내부 분류 키 (plan / sketch / site / reference / extra) */
  field: string
  /** 화면에 보여줄 분류 이름 (예: "현장 사진/동영상") */
  label: string
  /** 원본 파일명 — 어떤 사진/파일인지 구분하는 제목 역할 */
  name: string
  url: string
  /** true면 상세페이지에 실제 사진으로 미리보기가 뜨고, false면 파일 아이콘 + 이름 링크로 보입니다 */
  isImage: boolean
}

/** 체크리스트 한 항목 — 폼의 라벨과 방문자가 실제로 입력/선택한 값 */
export interface AnswerField {
  label: string
  value: string
}

/** 체크리스트 한 섹션 (예: "01. 기본 정보") — 관리자 화면에서 항목 제목과 답변을 구분해 보여주는 데 씁니다 */
export interface AnswerSection {
  num: string
  title: string
  fields: AnswerField[]
}

export interface ConsultFull extends ConsultListItem {
  phone: string | null
  email: string | null
  content: string
  attachments: ConsultAttachment[]
  /** 구조화된 체크리스트 답변 — 이 글이 등록될 당시 이 기능이 없었다면 빈 배열입니다 (이 경우 content 로 표시) */
  answers: AnswerSection[]
  /** 작성 화면의 체크리스트 선택 상태를 그대로 담은 값 — 수정 화면에서 폼을 복원하는 데만 씁니다 (비밀번호는 들어있지 않습니다) */
  form_data: Record<string, unknown>
  admin_reply: string | null
  replied_at: string | null
  /** 선택한 아바타 id (예: "female-3") — 선택하지 않았으면 빈 문자열 */
  avatar: string
}

export interface ConsultSubmission {
  name: string
  phone: string
  email: string
  title: string
  content: string
  password: string
  isSecret: boolean
  attachments: ConsultAttachment[]
  answers: AnswerSection[]
  formData: Record<string, unknown>
  avatar: string
}

/** 글 수정 시 보낼 내용 — password 는 새로 바꾸는 게 아니라 "본인 확인"용입니다 */
export interface ConsultUpdate {
  name: string
  phone: string
  email: string
  title: string
  content: string
  isSecret: boolean
  attachments: ConsultAttachment[]
  answers: AnswerSection[]
  formData: Record<string, unknown>
  avatar: string
}

/* ------------------------------------------------------------------ */
/* 아바타 선택 (이전 방식) — 여/남 각 12개씩, public/avatars/ 에 미리 만들어 둔 이미지.
   지금은 "나의 이미지" 자리에 아래 건물 이미지가 대신 쓰이지만, 이전에 아바타를
   선택해 작성된 글이 있을 수 있어 avatarUrl() 에서 계속 해석해 줍니다.          */
/* ------------------------------------------------------------------ */

export type AvatarGender = 'female' | 'male'

export const AVATAR_OPTIONS: Record<AvatarGender, string[]> = {
  female: Array.from({ length: 12 }, (_, i) => `female-${i + 1}`),
  male: Array.from({ length: 12 }, (_, i) => `male-${i + 1}`),
}

/* ------------------------------------------------------------------ */
/* 공간 용도 → 건물 이미지 — "나의 이미지"에 아바타 대신 보여줄 이미지.
   작성자가 "03. 프로젝트 정보"에서 고른 공간 용도에 맞춰 자동으로 정해지며,
   public/buildings/1.png ~ 21.png 로 미리 준비해 두었습니다 (가로:세로 = 3:4).
   기존 1~20번은 그대로 두고(이미 제출된 글의 avatar 값이 계속 맞는 이미지를
   가리키도록), "판매매장 / 쇼룸"만 "사무실 / 오피스"와 같이 쓰던 이미지에서
   분리해 새 번호 21번을 따로 받았습니다. */
/* ------------------------------------------------------------------ */

/** ConsultWrite.tsx 의 SPACE_GROUPS 옵션 라벨과 정확히 일치해야 합니다 */
export const SPACE_TYPE_BUILDING_ID: Record<string, string> = {
  '아파트': '1',
  '빌라 / 다세대주택': '2',
  '단독주택 / 전원주택': '3',
  '오피스텔': '4',
  '카페 / 베이커리': '5',
  '음식점 / 주점': '6',
  '필라테스 / 헬스장 / 요가': '7',
  '병원 / 의원': '8',
  '미용실 / 네일 / 뷰티숍': '9',
  '사무실 / 오피스': '10',
  '숙박시설 (에어비앤비 / 호스텔)': '11',
  '학교 / 교육기관': '12',
  '학원': '13',
  '어린이집 / 유치원': '14',
  '스터디카페 / 독서실': '15',
  '팝업스토어': '16',
  '전시관 / 갤러리': '17',
  '박람회 / 전시부스': '18',
  '문화 / 체험공간': '19',
  '기타': '20',
  '판매매장 / 쇼룸': '21',
}

/** 선택한 공간 용도 라벨로 건물 이미지 id(1~21)를 찾습니다. 해당 없으면 null */
export function buildingImageIdFor(spaceType: string): string | null {
  return SPACE_TYPE_BUILDING_ID[spaceType] ?? null
}

/**
 * "나의 이미지" 필드(avatar 컬럼)에 담긴 id로 이미지 경로를 돌려줍니다.
 * 숫자만 있으면(예: "4") 건물 이미지, 아니면(예: "female-3") 이전 아바타 이미지로 처리합니다.
 */
export function avatarUrl(id: string): string {
  if (/^\d+$/.test(id)) return `/buildings/${id}.png`
  return `/avatars/${id}.png`
}

export const CONSULT_TABLE_MISSING =
  '상담게시판 테이블이 아직 만들어지지 않았습니다. 전달드린 supabase-consultations.sql 을 Supabase 대시보드 SQL Editor 에서 실행해 주세요.'

function isMissingTableError(error: unknown): boolean {
  const msg = (error as { message?: string } | null)?.message ?? ''
  return /relation .* does not exist|function .* does not exist|schema cache/i.test(msg)
}

export async function listConsultations(
  page = 1,
  pageSize = 15,
): Promise<{ items: ConsultListItem[]; total: number; error: string | null }> {
  if (!supabase) return { items: [], total: 0, error: null }
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('consultations')
    .select('id, created_at, name, title, is_secret, status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    return { items: [], total: 0, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  return { items: (data ?? []) as ConsultListItem[], total: count ?? 0, error: null }
}

export async function submitConsultation(payload: ConsultSubmission): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('submit_consultation', {
    p_name: payload.name,
    p_phone: payload.phone || null,
    p_email: payload.email || null,
    p_title: payload.title,
    p_content: payload.content,
    p_password: payload.password,
    p_is_secret: payload.isSecret,
    p_attachments: payload.attachments,
    p_answers: payload.answers,
    p_form_data: payload.formData,
    p_avatar: payload.avatar || '',
  })
  if (error) {
    return { id: null, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  return { id: data as string, error: null }
}

/** 글 수정 — 작성 시 입력한 비밀번호가 맞아야만 반영됩니다 */
export async function updateConsultation(
  id: string,
  password: string,
  payload: ConsultUpdate,
): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('update_consultation', {
    p_id: id,
    p_password: password,
    p_name: payload.name,
    p_phone: payload.phone || null,
    p_email: payload.email || null,
    p_title: payload.title,
    p_content: payload.content,
    p_is_secret: payload.isSecret,
    p_attachments: payload.attachments,
    p_answers: payload.answers,
    p_form_data: payload.formData,
    p_avatar: payload.avatar || '',
  })
  if (error) {
    return { ok: false, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  if (data !== true) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  return { ok: true, error: null }
}

/** 글 삭제 — 작성 시 입력한 비밀번호가 맞아야만 삭제됩니다 */
export async function deleteConsultation(id: string, password: string): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('delete_consultation', { p_id: id, p_password: password })
  if (error) {
    return { ok: false, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  if (data !== true) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  return { ok: true, error: null }
}

/* ------------------------------------------------------------------ */
/* 답변 댓글창 — 관리자와 작성자가 여러 번 주고받는 댓글 형태의 답변         */
/* ------------------------------------------------------------------ */

export interface ConsultReply {
  id: string
  author: 'admin' | 'visitor'
  content: string
  created_at: string
}

/** 댓글 목록 — 공개글은 비밀번호 없이, 비밀글은 비밀번호가 맞아야 보입니다 (방문자용) */
export async function listConsultReplies(id: string, password: string): Promise<{ items: ConsultReply[]; error: string | null }> {
  if (!supabase) return { items: [], error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('list_consult_replies', { p_id: id, p_password: password })
  if (error) {
    return { items: [], error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  return { items: (data ?? []) as ConsultReply[], error: null }
}

/** 작성자 본인이 댓글(재답변)을 남깁니다 — 비밀번호가 맞아야만 등록됩니다 (방문자용) */
export async function addConsultReply(id: string, password: string, content: string): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('add_consult_reply', { p_id: id, p_password: password, p_content: content })
  if (error) {
    return { ok: false, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  if (data !== true) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  return { ok: true, error: null }
}

/** 댓글 목록 — 관리자용 (로그인 계정으로 테이블에 직접 접근, 비밀글도 모두 보입니다) */
export async function adminListReplies(consultationId: string): Promise<{ items: ConsultReply[]; error: string | null }> {
  if (!supabase) return { items: [], error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase
    .from('consult_replies')
    .select('id, author, content, created_at')
    .eq('consultation_id', consultationId)
    .order('created_at', { ascending: true })
  if (error) return { items: [], error: error.message }
  return { items: (data ?? []) as ConsultReply[], error: null }
}

/** 관리자가 댓글(답변)을 남깁니다 — 등록과 함께 글 상태를 "답변완료"로 바꿉니다 */
export async function adminAddReply(consultationId: string, content: string): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase 연결 정보가 없습니다.' }
  const { error: insertErr } = await supabase
    .from('consult_replies')
    .insert({ consultation_id: consultationId, author: 'admin', content })
  if (insertErr) return { ok: false, error: insertErr.message }
  const { error: updateErr } = await supabase
    .from('consultations')
    .update({ status: '답변완료', replied_at: new Date().toISOString() })
    .eq('id', consultationId)
  if (updateErr) return { ok: false, error: updateErr.message }
  return { ok: true, error: null }
}

/** 목록/미리보기용 메타 정보만 가져옵니다 (비밀글 여부 확인용, 비밀번호 불필요) */
export async function getConsultationMeta(id: string): Promise<ConsultListItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('consultations')
    .select('id, created_at, name, title, is_secret, status')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as ConsultListItem
}

/** 실제 본문 — 공개글이면 비밀번호 없이, 비밀글이면 비밀번호가 맞아야 내용이 돌아옵니다 */
export async function getConsultation(id: string, password: string): Promise<{ item: ConsultFull | null; error: string | null }> {
  if (!supabase) return { item: null, error: 'Supabase 연결 정보가 없습니다.' }
  const { data, error } = await supabase.rpc('get_consultation', { p_id: id, p_password: password })
  if (error) {
    return { item: null, error: isMissingTableError(error) ? CONSULT_TABLE_MISSING : error.message }
  }
  const row = Array.isArray(data) ? data[0] : data
  return { item: (row ?? null) as ConsultFull | null, error: null }
}

/* ------------------------------------------------------------------ */
/* 상담 첨부파일 (도면 / 손그림 / 현장 사진·동영상 / 레퍼런스 / 추가 자료)   */
/* ------------------------------------------------------------------ */

export const CONSULT_UPLOAD_BUCKET = 'consult-uploads'

/** 상담글 하나를 작성하는 동안 첨부파일을 모아둘 임시 폴더 이름 (등록 전까지는 서버에 저장되지 않습니다) */
export function newConsultSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Supabase Storage 는 저장 경로(key)에 한글 등 비-ASCII 문자가 들어가면
 * "Invalid key" 오류로 업로드 자체를 거부합니다. 그래서 실제 저장 경로에는
 * 영문/숫자만 남기고, 원본 파일명(한글 포함)은 화면에 보여줄 때만 따로
 * 사용합니다 (ConsultAttachment.name — 업로드 결과의 file.name 그대로).
 */
function safeAttachmentName(name: string): string {
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : ''
  const cleanStem = stem.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 60) || 'file'
  return `${cleanStem}${ext}`
}

export interface UploadedAttachment {
  name: string
  url: string
  isImage: boolean
}

/**
 * 첨부파일 하나를 consult-uploads 버킷에 올립니다.
 * 등록 실패(버킷이 아직 없거나 용량 초과 등)에도 나머지 진행이 막히지 않도록
 * 예외 대신 null 을 돌려줍니다 — 호출하는 쪽에서 null 개수를 세어 사용자에게 안내합니다.
 */
export async function uploadConsultFile(
  sessionId: string,
  fieldKey: string,
  file: File,
): Promise<UploadedAttachment | null> {
  if (!supabase) return null
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const path = `${sessionId}/${fieldKey}/${stamp}-${safeAttachmentName(file.name)}`
  const { error } = await supabase.storage.from(CONSULT_UPLOAD_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) return null
  const { data } = supabase.storage.from(CONSULT_UPLOAD_BUCKET).getPublicUrl(path)
  return { name: file.name, url: data.publicUrl, isImage: file.type.startsWith('image/') }
}
