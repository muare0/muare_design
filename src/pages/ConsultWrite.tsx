import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useSiteContent } from '../hooks/useSiteData'
import {
  submitConsultation,
  updateConsultation,
  getConsultation,
  uploadConsultFile,
  newConsultSessionId,
  avatarUrl,
  buildingImageIdFor,
  type UploadedAttachment,
  type ConsultAttachment,
  type AnswerSection,
} from '../lib/consultService'

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: { roadAddress?: string; jibunAddress?: string }) => void }) => {
        open: () => void
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 체크리스트 항목 정의                                                 */
/* ------------------------------------------------------------------ */

const SOURCE_CHANNELS = ['네이버 블로그', '홈페이지', '인스타그램', '크몽', '지인 소개', '기타']

const SERVICE_TYPES: { key: string; desc: string }[] = [
  { key: '공간 설계', desc: '공간 구성, 동선 및 레이아웃 계획' },
  { key: '디자인 제안', desc: '컨셉, 컬러, 마감재, 가구 및 조명 등 디자인 방향 제안' },
  { key: '3D 모델링', desc: '도면 또는 현장 자료를 바탕으로 공간을 3D로 구현' },
  { key: '렌더링', desc: '3D 모델을 기반으로 실제 공간과 유사한 이미지 제작' },
  { key: '전체 디자인 패키지', desc: '공간 설계 + 디자인 제안 + 3D 모델링 + 렌더링' },
  { key: '기타', desc: '' },
]

const SPACE_GROUPS: { group: string; options: string[] }[] = [
  { group: '주거공간', options: ['아파트', '빌라 / 다세대주택', '단독주택 / 전원주택', '오피스텔'] },
  {
    group: '상업공간',
    options: [
      '카페 / 베이커리',
      '음식점 / 주점',
      '필라테스 / 헬스장 / 요가',
      '병원 / 의원',
      '미용실 / 네일 / 뷰티숍',
      '판매매장 / 쇼룸',
      '사무실 / 오피스',
      '숙박시설 (에어비앤비 / 호스텔)',
    ],
  },
  { group: '교육공간', options: ['학교 / 교육기관', '학원', '어린이집 / 유치원', '스터디카페 / 독서실'] },
  { group: '전시·문화공간', options: ['팝업스토어', '전시관 / 갤러리', '박람회 / 전시부스', '문화 / 체험공간'] },
]

const PLAN_TYPES = ['단위세대 평면도', '건축도면 이미지 / PDF', 'DWG 캐드파일', '기타 도면', '도면 없음', '모름']
const PLAN_EXCLUSIVE = ['도면 없음', '모름']
const PLAN_FILE_TRIGGERS = ['단위세대 평면도', '건축도면 이미지 / PDF', 'DWG 캐드파일', '기타 도면']

const SITE_MEDIA_OPTIONS = ['현장 사진 첨부 가능', '현장 동영상 첨부 가능', '현재 첨부 어려움']
const SITE_MEDIA_EXCLUSIVE = ['현재 첨부 어려움']
const SITE_MEDIA_FILE_TRIGGERS = ['현장 사진 첨부 가능', '현장 동영상 첨부 가능']

const STYLE_OPTIONS = ['모던', '미니멀', '내추럴', '클래식', '빈티지', '한옥 / 전통', '기타', '잘 모르겠음 / 디자인 제안 희망']

const REFERENCE_OPTIONS = ['이미지 첨부', 'Pinterest / SNS 등 링크 첨부', '별도 레퍼런스 없음']
const REFERENCE_EXCLUSIVE = ['별도 레퍼런스 없음']

/* ------------------------------------------------------------------ */
/* 폼 상태 타입                                                        */
/* ------------------------------------------------------------------ */

interface FormState {
  name: string
  phone: string
  email: string
  apptDate: string
  apptTime: string
  sourceChannels: string[]
  sourceOther: string

  serviceTypes: string[]
  serviceOther: string

  addressBase: string
  addressDetail: string
  spaceType: string
  spaceOther: string
  areaValue: string
  areaUnit: '㎡' | '평'
  areaUnknown: boolean
  apartmentType: string
  startDate: string
  startUnset: boolean
  endDate: string
  endUnset: boolean

  planTypes: string[]
  sketchAvailable: '' | '첨부 가능' | '첨부 어려움'
  siteMedia: string[]
  ceilingHeight: string
  ceilingUnknown: boolean
  siteNotes: string
  siteNotesNone: boolean

  styles: string[]
  styleOther: string
  references: string[]
  referenceUrl: string
  spaceRequests: string
  otherNotes: string
  otherNotesNone: boolean

  password: string
  isSecret: boolean
  agree: boolean

  /** 선택한 아바타 id (예: "female-3") — 선택 안 했으면 빈 문자열 */
  avatar: string
}

interface FileState {
  plan: File[]
  sketch: File[]
  site: File[]
  reference: File[]
  extra: File[]
}

const INITIAL_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  apptDate: '',
  apptTime: '',
  sourceChannels: [],
  sourceOther: '',

  serviceTypes: [],
  serviceOther: '',

  addressBase: '',
  addressDetail: '',
  spaceType: '',
  spaceOther: '',
  areaValue: '',
  areaUnit: '평',
  areaUnknown: false,
  apartmentType: '',
  startDate: '',
  startUnset: false,
  endDate: '',
  endUnset: false,

  planTypes: [],
  sketchAvailable: '',
  siteMedia: [],
  ceilingHeight: '',
  ceilingUnknown: false,
  siteNotes: '',
  siteNotesNone: false,

  styles: [],
  styleOther: '',
  references: [],
  referenceUrl: '',
  spaceRequests: '',
  otherNotes: '',
  otherNotesNone: false,

  password: '',
  isSecret: true,
  agree: false,

  avatar: '',
}

const INITIAL_FILES: FileState = { plan: [], sketch: [], site: [], reference: [], extra: [] }

/**
 * 폼 상태의 각 항목(key)이 어떤 필드 블록(id)에 속하는지 매핑해 둔 표입니다.
 * - 등록 시 유효성 오류가 나면 해당 필드로 이동 + 그 자리에 오류 문구를 보여주는 데 사용하고,
 * - 사용자가 그 필드를 다시 고치면 표시했던 오류를 자동으로 지우는 데도 같은 표를 사용합니다.
 */
const FIELD_ID_BY_KEY: Partial<Record<keyof FormState, string>> = {
  name: 'field-name',
  phone: 'field-phone',
  email: 'field-email',
  apptDate: 'field-appt',
  apptTime: 'field-appt',
  sourceChannels: 'field-source',
  sourceOther: 'field-source',
  serviceTypes: 'field-service',
  serviceOther: 'field-service',
  addressBase: 'field-address',
  spaceType: 'field-space',
  spaceOther: 'field-space',
  areaValue: 'field-area',
  areaUnknown: 'field-area',
  startDate: 'field-start',
  startUnset: 'field-start',
  endDate: 'field-end',
  endUnset: 'field-end',
  planTypes: 'field-plan',
  sketchAvailable: 'field-sketch',
  siteMedia: 'field-sitemedia',
  ceilingHeight: 'field-ceiling',
  ceilingUnknown: 'field-ceiling',
  siteNotes: 'field-sitenotes',
  siteNotesNone: 'field-sitenotes',
  styles: 'field-styles',
  references: 'field-references',
  spaceRequests: 'field-spacerequests',
  otherNotes: 'field-othernotes',
  otherNotesNone: 'field-othernotes',
  password: 'field-password',
  agree: 'field-agree',
}

/* ------------------------------------------------------------------ */
/* 자잘한 도우미                                                        */
/* ------------------------------------------------------------------ */

function toggleMulti(list: string[], value: string, exclusive: string[] = []): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value)
  if (exclusive.includes(value)) return [value]
  return [...list.filter((v) => !exclusive.includes(v)), value]
}

function loadDaumPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve()
      return
    }
    const existing = document.getElementById('daum-postcode-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('load failed')))
      return
    }
    const script = document.createElement('script')
    script.id = 'daum-postcode-script'
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('load failed'))
    document.body.appendChild(script)
  })
}

/** 숫자만 입력해도 010-0000-0000 처럼 자동으로 하이픈이 붙도록 정리합니다 (서울 지역번호 02 도 고려) */
function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.startsWith('02')) {
    if (digits.length < 3) return digits
    if (digits.length < 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length < 10) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length < 4) return digits
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length < 11) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

function buildTitle(f: FormState): string {
  const label = f.spaceType === '기타' && f.spaceOther.trim() ? f.spaceOther.trim() : f.spaceType || '공간'
  return `${label} 상담 신청 — ${f.name.trim()}`
}

/** 카테고리 키 → 첨부파일 갤러리에 보여줄 한글 분류 이름 */
const ATTACHMENT_LABELS: Record<keyof FileState, string> = {
  plan: '도면',
  sketch: '손그림',
  site: '현장 사진/동영상',
  reference: '레퍼런스',
  extra: '추가 자료',
}

/** 업로드된 파일들을 상세페이지 갤러리에서 쓸 수 있는 한 줄 목록으로 펼칩니다 */
function flattenAttachments(uploads: Record<string, UploadedAttachment[]>): ConsultAttachment[] {
  const out: ConsultAttachment[] = []
  for (const [field, label] of Object.entries(ATTACHMENT_LABELS)) {
    for (const u of uploads[field] ?? []) {
      out.push({ field, label, name: u.name, url: u.url, isImage: u.isImage })
    }
  }
  return out
}

function buildContent(f: FormState): string {
  const lines: string[] = []

  lines.push('[01. 기본 정보]')
  lines.push(`상담 예약: ${f.apptDate}${f.apptTime ? ' ' + f.apptTime : ''}`)
  {
    const other = f.sourceChannels.includes('기타') && f.sourceOther.trim() ? ` (${f.sourceOther.trim()})` : ''
    lines.push(`알게 된 경로: ${f.sourceChannels.join(', ')}${other}`)
  }

  lines.push('')
  lines.push('[02. 상담 유형]')
  {
    const other = f.serviceTypes.includes('기타') && f.serviceOther.trim() ? ` (${f.serviceOther.trim()})` : ''
    lines.push(`서비스 유형: ${f.serviceTypes.join(', ')}${other}`)
  }

  lines.push('')
  lines.push('[03. 프로젝트 정보]')
  lines.push(`현장 주소: ${f.addressBase}${f.addressDetail.trim() ? ' ' + f.addressDetail.trim() : ''}`)
  {
    const spaceLabel = f.spaceType === '기타' && f.spaceOther.trim() ? `기타 (${f.spaceOther.trim()})` : f.spaceType
    const typeSuffix = f.spaceType === '아파트' && f.apartmentType.trim() ? ` · 타입 ${f.apartmentType.trim()}` : ''
    lines.push(`공간 용도: ${spaceLabel}${typeSuffix}`)
  }
  lines.push(`공급면적: ${f.areaUnknown ? '모름' : `${f.areaValue}${f.areaUnit}`}`)
  lines.push(`디자인 작업 희망 시작일: ${f.startUnset ? '일정 미정 / 협의 필요' : f.startDate}`)
  lines.push(`디자인 완료 희망일: ${f.endUnset ? '일정 미정 / 협의 필요' : f.endDate}`)

  lines.push('')
  lines.push('[04. 현장 정보]')
  lines.push(`보유 도면: ${f.planTypes.join(', ')}`)
  lines.push(`치수가 기재된 손그림: ${f.sketchAvailable}`)
  lines.push(`현장 사진 및 동영상: ${f.siteMedia.join(', ')}`)
  lines.push(`천장 높이: ${f.ceilingUnknown ? '모름' : `약 ${f.ceilingHeight}mm`}`)
  lines.push(`기타 현장 특이사항: ${f.siteNotesNone ? '특이사항 없음' : f.siteNotes.trim()}`)

  lines.push('')
  lines.push('[05. 디자인 요청사항]')
  {
    const other = f.styles.includes('기타') && f.styleOther.trim() ? ` (${f.styleOther.trim()})` : ''
    lines.push(`희망 디자인 스타일: ${f.styles.join(', ')}${other}`)
  }
  {
    const url =
      f.references.includes('Pinterest / SNS 등 링크 첨부') && f.referenceUrl.trim() ? ` — ${f.referenceUrl.trim()}` : ''
    lines.push(`참고 레퍼런스: ${f.references.join(', ')}${url}`)
  }
  lines.push(`공간별 요청사항: ${f.spaceRequests.trim()}`)
  lines.push(`기타 전달사항: ${f.otherNotesNone ? '별도 전달사항 없음' : f.otherNotes.trim()}`)

  return lines.join('\n')
}

/**
 * buildContent() 와 똑같은 섹션/항목 구성을, 관리자 화면에서 "항목 제목"과
 * "방문자가 입력한 값"을 구분해서 보여줄 수 있도록 구조화된 형태로 만듭니다.
 */
function buildAnswers(f: FormState): AnswerSection[] {
  return [
    {
      num: '01',
      title: '기본 정보',
      fields: [
        { label: '상담 예약', value: `${f.apptDate}${f.apptTime ? ' ' + f.apptTime : ''}` },
        {
          label: '알게 된 경로',
          value:
            f.sourceChannels.join(', ') +
            (f.sourceChannels.includes('기타') && f.sourceOther.trim() ? ` (${f.sourceOther.trim()})` : ''),
        },
      ],
    },
    {
      num: '02',
      title: '상담 유형',
      fields: [
        {
          label: '서비스 유형',
          value:
            f.serviceTypes.join(', ') +
            (f.serviceTypes.includes('기타') && f.serviceOther.trim() ? ` (${f.serviceOther.trim()})` : ''),
        },
      ],
    },
    {
      num: '03',
      title: '프로젝트 정보',
      fields: [
        { label: '현장 주소', value: `${f.addressBase}${f.addressDetail.trim() ? ' ' + f.addressDetail.trim() : ''}` },
        {
          label: '공간 용도',
          value:
            (f.spaceType === '기타' && f.spaceOther.trim() ? `기타 (${f.spaceOther.trim()})` : f.spaceType) +
            (f.spaceType === '아파트' && f.apartmentType.trim() ? ` · 타입 ${f.apartmentType.trim()}` : ''),
        },
        { label: '공급면적', value: f.areaUnknown ? '모름' : `${f.areaValue}${f.areaUnit}` },
        { label: '디자인 작업 희망 시작일', value: f.startUnset ? '일정 미정 / 협의 필요' : f.startDate },
        { label: '디자인 완료 희망일', value: f.endUnset ? '일정 미정 / 협의 필요' : f.endDate },
      ],
    },
    {
      num: '04',
      title: '현장 정보',
      fields: [
        { label: '보유 도면', value: f.planTypes.join(', ') },
        { label: '치수가 기재된 손그림', value: f.sketchAvailable },
        { label: '현장 사진 및 동영상', value: f.siteMedia.join(', ') },
        { label: '천장 높이', value: f.ceilingUnknown ? '모름' : `약 ${f.ceilingHeight}mm` },
        { label: '기타 현장 특이사항', value: f.siteNotesNone ? '특이사항 없음' : f.siteNotes.trim() },
      ],
    },
    {
      num: '05',
      title: '디자인 요청사항',
      fields: [
        {
          label: '희망 디자인 스타일',
          value: f.styles.join(', ') + (f.styles.includes('기타') && f.styleOther.trim() ? ` (${f.styleOther.trim()})` : ''),
        },
        {
          label: '참고 레퍼런스',
          value:
            f.references.join(', ') +
            (f.references.includes('Pinterest / SNS 등 링크 첨부') && f.referenceUrl.trim()
              ? ` — ${f.referenceUrl.trim()}`
              : ''),
        },
        { label: '공간별 요청사항', value: f.spaceRequests.trim() },
        { label: '기타 전달사항', value: f.otherNotesNone ? '별도 전달사항 없음' : f.otherNotes.trim() },
      ],
    },
  ]
}

/**
 * 관리자 테스트용 — 체크박스를 누르면 필수 항목을 임의의 값으로 채워서 매번 처음부터
 * 다 입력하지 않아도 등록 테스트를 해볼 수 있게 해줍니다. (비밀번호/동의도 함께 채워집니다)
 */
function fillTestData(f: FormState): FormState {
  return {
    ...f,
    name: '테스트홍길동',
    phone: '010-1234-5678',
    email: 'test@example.com',
    apptDate: '2026-10-01',
    apptTime: '14:00',
    sourceChannels: ['홈페이지'],
    sourceOther: '',
    serviceTypes: ['공간 설계', '디자인 제안'],
    serviceOther: '',
    addressBase: '서울특별시 강남구 테헤란로 123',
    addressDetail: '5층 501호',
    spaceType: '오피스텔',
    spaceOther: '',
    areaValue: '25',
    areaUnit: '평',
    areaUnknown: false,
    apartmentType: '',
    startDate: '2026-10-15',
    startUnset: false,
    endDate: '2026-11-30',
    endUnset: false,
    planTypes: ['도면 없음'],
    sketchAvailable: '첨부 어려움',
    siteMedia: ['현재 첨부 어려움'],
    ceilingHeight: '',
    ceilingUnknown: true,
    siteNotes: '',
    siteNotesNone: true,
    styles: ['모던'],
    styleOther: '',
    references: ['별도 레퍼런스 없음'],
    referenceUrl: '',
    spaceRequests: '테스트용 공간별 요청사항입니다.',
    otherNotes: '',
    otherNotesNone: true,
    password: f.password.trim() || 'test1234',
    isSecret: true,
    agree: true,
    // spaceType 이 채워지면 useEffect 가 알아서 건물 이미지로 avatar 를 맞춰줍니다
    avatar: f.avatar,
  }
}

/** 폼 상태를 수정 화면에서 그대로 복원할 수 있게 저장용으로 정리합니다 (비밀번호는 절대 포함하지 않습니다) */
function toFormData(f: FormState): Record<string, unknown> {
  const { password: _password, agree: _agree, ...rest } = f
  return rest
}

/** 저장돼 있던 form_data 로 폼을 복원합니다 — 없는 값은 기본값을 그대로 씁니다 */
function fromFormData(data: Record<string, unknown> | null | undefined): FormState {
  if (!data || typeof data !== 'object') return INITIAL_FORM
  return { ...INITIAL_FORM, ...data, password: '', agree: true }
}

/** 유효성 오류 한 건 — 어떤 필드(id)에서 어떤 문제(message)인지 함께 담습니다 */
interface FieldError {
  id: string
  message: string
}

function validate(f: FormState, isEdit: boolean): FieldError[] {
  const errs: FieldError[] = []
  const push = (id: string, message: string) => errs.push({ id, message })

  if (!f.name.trim()) push('field-name', '성함을 입력해 주세요.')
  if (!f.phone.trim()) push('field-phone', '연락처를 입력해 주세요.')
  if (!f.email.trim()) push('field-email', '이메일을 입력해 주세요.')
  if (!f.apptDate || !f.apptTime) push('field-appt', '상담 예약 날짜와 시간을 선택해 주세요.')
  if (f.sourceChannels.length === 0) push('field-source', '뮤아르디자인스튜디오를 알게 된 경로를 선택해 주세요.')
  if (f.serviceTypes.length === 0) push('field-service', '원하시는 서비스 유형을 선택해 주세요.')
  if (!f.addressBase.trim()) push('field-address', '현장 주소를 입력해 주세요.')
  if (!f.spaceType) push('field-space', '공간 용도를 선택해 주세요.')
  if (!f.areaUnknown && !f.areaValue.trim()) push('field-area', '공급면적을 입력해 주세요.')
  if (!f.startUnset && !f.startDate) push('field-start', '디자인 작업 희망 시작일을 선택해 주세요.')
  if (!f.endUnset && !f.endDate) push('field-end', '디자인 완료 희망일을 선택해 주세요.')
  if (f.planTypes.length === 0) push('field-plan', '보유하고 계신 도면을 선택해 주세요.')
  if (!f.sketchAvailable) push('field-sketch', '치수가 기재된 손그림 첨부 가능 여부를 선택해 주세요.')
  if (f.siteMedia.length === 0) push('field-sitemedia', '현장 사진 및 동영상 첨부 가능 여부를 선택해 주세요.')
  if (!f.ceilingUnknown && !f.ceilingHeight.trim()) push('field-ceiling', '천장 높이를 입력해 주세요.')
  if (!f.siteNotesNone && !f.siteNotes.trim())
    push('field-sitenotes', '기타 현장 특이사항을 입력하거나 "특이사항 없음"을 선택해 주세요.')
  if (f.styles.length === 0) push('field-styles', '희망하는 디자인 스타일을 선택해 주세요.')
  if (f.references.length === 0) push('field-references', '참고하고 있는 디자인 또는 레퍼런스 여부를 선택해 주세요.')
  if (!f.spaceRequests.trim()) push('field-spacerequests', '공간별 요청사항을 입력해 주세요.')
  if (!f.otherNotesNone && !f.otherNotes.trim())
    push('field-othernotes', '기타 전달사항을 입력하거나 "별도 전달사항 없음"을 선택해 주세요.')
  if (!isEdit) {
    if (!f.password.trim()) push('field-password', '비밀번호를 입력해 주세요.')
    else if (f.password.trim().length < 4) push('field-password', '비밀번호는 4자 이상 입력해 주세요.')
    if (!f.agree) push('field-agree', '개인정보 수집 및 이용에 동의해 주세요.')
  }

  return errs
}

/* ------------------------------------------------------------------ */
/* 재사용 UI 조각들                                                     */
/* ------------------------------------------------------------------ */

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <div className="field-label">
      {children}
      {required && <span className="field-required">*</span>}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="form-note">※ {children}</p>
}

/** 해당 필드에 지금 표시할 오류 문구가 있으면 그 자리에서 바로 보여줍니다 */
function FieldErrorMsg({ id, errors }: { id: string; errors: Record<string, string> }) {
  if (!errors[id]) return null
  return <p className="field-error-msg">⚠ {errors[id]}</p>
}

function CheckGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="option-grid">
      {options.map((opt) => (
        <label key={opt} className={`option-check${selected.includes(opt) ? ' checked' : ''}`}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  )
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="option-grid">
      {options.map((opt) => (
        <label key={opt} className={`option-check${value === opt ? ' checked' : ''}`}>
          <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  )
}

const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50MB — consult-uploads 버킷 제한과 동일하게 맞췄습니다

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

function FileField({
  id,
  files,
  onChange,
  multiple = true,
  accept,
  onOversize,
}: {
  id: string
  files: File[]
  onChange: (files: File[]) => void
  multiple?: boolean
  accept?: string
  onOversize?: (name: string) => void
}) {
  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const ok: File[] = []
    for (const file of picked) {
      if (file.size > MAX_FILE_BYTES) {
        onOversize?.(file.name)
        continue
      }
      ok.push(file)
    }
    onChange(multiple ? [...files, ...ok] : ok.slice(-1))
  }

  return (
    <div className="file-field">
      <input id={id} type="file" multiple={multiple} accept={accept} onChange={handlePick} />
      <label htmlFor={id} className="file-field-btn">
        + 파일 선택
      </label>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span className="file-list-name">{f.name}</span>
              <span className="file-list-size">{formatBytes(f.size)}</span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label="첨부 제거">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 수정 화면에서 이미 등록돼 있는 첨부파일을 보여주고, 필요하면 빼도록 해줍니다 */
function ExistingAttachmentList({
  items,
  onRemove,
}: {
  items: ConsultAttachment[]
  onRemove: (item: ConsultAttachment) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="existing-attachments">
      <div className="existing-attachments-label">기존에 첨부하신 파일</div>
      <ul className="file-list">
        {items.map((a, i) => (
          <li key={`${a.url}-${i}`}>
            <span className="file-list-name">{a.name}</span>
            <span className="file-list-size">{a.label}</span>
            <button type="button" onClick={() => onRemove(a)} aria-label="첨부 제거">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 메인 컴포넌트                                                        */
/* ------------------------------------------------------------------ */

/** 상담게시판 — 새 글 작성 / 수정 (뮤아르디자인스튜디오 상담 요청지 체크리스트 기반) */
export default function ConsultWrite() {
  const { content } = useSiteContent()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const isEdit = Boolean(id)
  const editPassword = (location.state as { password?: string } | null)?.password ?? ''

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [files, setFiles] = useState<FileState>(INITIAL_FILES)
  const [sessionId] = useState(() => newConsultSessionId())
  const [existingAttachments, setExistingAttachments] = useState<ConsultAttachment[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [oversizeName, setOversizeName] = useState<string | null>(null)

  const [loadingExisting, setLoadingExisting] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 관리자 테스트용 자동 입력 — 체크하면 즉시 채워지고, 다음에 또 쓸 수 있도록 바로 체크 해제됩니다.
  const [devFillChecked, setDevFillChecked] = useState(false)
  function onToggleDevFill(checked: boolean) {
    setDevFillChecked(checked)
    if (!checked) return
    setForm((f) => fillTestData(f))
    setFieldErrors({})
    setTimeout(() => setDevFillChecked(false), 250)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  /**
   * "나의 이미지"는 더 이상 직접 고르는 아바타가 아니라, "03. 프로젝트 정보"에서 고른
   * 공간 용도에 맞는 건물 이미지가 선택 즉시 자동으로 표시됩니다.
   */
  useEffect(() => {
    const buildingId = form.spaceType ? buildingImageIdFor(form.spaceType) : null
    setForm((f) => (f.avatar === (buildingId ?? '') ? f : { ...f, avatar: buildingId ?? '' }))
  }, [form.spaceType])

  useEffect(() => {
    if (!isEdit || !id) return
    if (!editPassword) {
      setLoadError('비밀번호 확인 없이 수정 화면에 접근할 수 없습니다. 글 상세 화면에서 다시 시도해 주세요.')
      setLoadingExisting(false)
      return
    }
    let cancelled = false
    setLoadingExisting(true)
    void getConsultation(id, editPassword).then((res) => {
      if (cancelled) return
      if (!res.item) {
        setLoadError(res.error || '비밀번호가 일치하지 않아 글을 불러올 수 없습니다.')
        setLoadingExisting(false)
        return
      }
      setForm(fromFormData(res.item.form_data))
      setExistingAttachments(res.item.attachments ?? [])
      setLoadingExisting(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id])

  function clearFieldErrors(ids: Iterable<string>) {
    setFieldErrors((prev) => {
      let changed = false
      const next = { ...prev }
      for (const id of ids) {
        if (id in next) {
          delete next[id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }))
    const ids = new Set<string>()
    for (const key of Object.keys(p) as (keyof FormState)[]) {
      const id = FIELD_ID_BY_KEY[key]
      if (id) ids.add(id)
    }
    if (ids.size > 0) clearFieldErrors(ids)
  }

  function toggle(key: 'sourceChannels' | 'serviceTypes' | 'planTypes' | 'siteMedia' | 'styles' | 'references', value: string, exclusive: string[] = []) {
    setForm((f) => ({ ...f, [key]: toggleMulti(f[key], value, exclusive) }))
    const id = FIELD_ID_BY_KEY[key]
    if (id) clearFieldErrors([id])
  }

  async function openAddressSearch() {
    try {
      await loadDaumPostcodeScript()
      const Postcode = window.daum?.Postcode
      if (!Postcode) return
      new Postcode({
        oncomplete: (data) => {
          patch({ addressBase: data.roadAddress || data.jibunAddress || '' })
          setTimeout(() => document.getElementById('addr-detail')?.focus(), 0)
        },
      }).open()
    } catch {
      setFieldErrors((prev) => ({ ...prev, 'field-address': '주소 검색을 불러오지 못했습니다. 현장 주소 칸에 직접 입력해 주세요.' }))
    }
  }

  async function uploadAll(): Promise<{ uploads: Record<string, UploadedAttachment[]>; failedNames: string[] }> {
    const categories: (keyof FileState)[] = ['plan', 'sketch', 'site', 'reference', 'extra']
    const uploads: Record<string, UploadedAttachment[]> = {}
    const failedNames: string[] = []
    for (const key of categories) {
      const list = files[key]
      if (list.length === 0) continue
      const uploaded = await Promise.all(list.map((file) => uploadConsultFile(sessionId, key, file)))
      const ok: UploadedAttachment[] = []
      uploaded.forEach((u, i) => {
        if (u) ok.push(u)
        else failedNames.push(list[i].name)
      })
      uploads[key] = ok
    }
    return { uploads, failedNames }
  }

  function removeExistingAttachment(item: ConsultAttachment) {
    setExistingAttachments((list) => list.filter((a) => a !== item))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const errs = validate(form, isEdit)
    if (errs.length > 0) {
      const map: Record<string, string> = {}
      for (const err of errs) {
        if (!map[err.id]) map[err.id] = err.message
      }
      setFieldErrors(map)
      // 제일 위에서 걸린 항목으로 이동해서, 그 자리에서 바로 무엇이 잘못됐는지 보여줍니다.
      const firstEl = document.getElementById(errs[0].id)
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        firstEl.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true })
      }
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    const { uploads, failedNames } = await uploadAll()

    if (isEdit && id) {
      const result = await updateConsultation(id, editPassword, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        title: buildTitle(form),
        content: buildContent(form),
        isSecret: form.isSecret,
        attachments: [...existingAttachments, ...flattenAttachments(uploads)],
        answers: buildAnswers(form),
        formData: toFormData(form),
        avatar: form.avatar,
      })
      setSubmitting(false)
      if (!result.ok) {
        setSubmitError(result.error || '수정 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      navigate(`/consult/${id}`, {
        state: {
          justPosted: true,
          password: editPassword,
          uploadWarning: failedNames.length > 0 ? failedNames : undefined,
        },
      })
      return
    }

    const result = await submitConsultation({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      title: buildTitle(form),
      content: buildContent(form),
      password: form.password.trim(),
      isSecret: form.isSecret,
      attachments: flattenAttachments(uploads),
      answers: buildAnswers(form),
      formData: toFormData(form),
      avatar: form.avatar,
    })
    setSubmitting(false)

    if (result.error || !result.id) {
      setSubmitError(result.error || '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate(`/consult/${result.id}`, {
      state: {
        justPosted: true,
        password: form.password.trim(),
        uploadWarning: failedNames.length > 0 ? failedNames : undefined,
      },
    })
  }

  if (isEdit && (loadingExisting || loadError)) {
    return (
      <>
        <Header site={content.site} />
        <div className="board-page">
          <div className="wrap archive-head archive-head-form">
            <Link to={id ? `/consult/${id}` : '/consult'} className="back-btn back-btn-top">
              ← 글로 돌아가기
            </Link>
            <Reveal>
              <div className="eyebrow-plain">Consult</div>
              <h1 className="section-title">상담 요청지 수정</h1>
            </Reveal>
          </div>
          <div className="wrap board-wrap board-form-wrap">
            <div className="board-empty">{loadingExisting ? '불러오는 중…' : loadError}</div>
          </div>
        </div>
        <Footer site={content.site} contact={content.contact} />
      </>
    )
  }

  return (
    <>
      <Header site={content.site} />

      <div className="board-page">
        <div className="wrap archive-head archive-head-form">
          <Link to={isEdit && id ? `/consult/${id}` : '/consult'} className="back-btn back-btn-top">
            {isEdit ? '← 글로 돌아가기' : '← 목록으로'}
          </Link>
          <Reveal>
            <div className="eyebrow-plain">Consult</div>
            <h1 className="section-title">{isEdit ? '상담 요청지 수정' : '상담 요청지 작성'}</h1>
            {!isEdit && (
              <p className="board-intro">
                보다 정확한 상담과 원활한 디자인 진행을 위해 아래 체크리스트를 준비했습니다.
                <br />
                작성해 주신 내용을 바탕으로 공간의 현황과 원하시는 방향을 미리 파악하여 더욱 구체적인 상담을 도와드릴 수 있습니다.
                <br />
                조금 번거로우시더라도 원활한 상담을 위해 작성 부탁드립니다 :)
              </p>
            )}
          </Reveal>
        </div>

        <div className="wrap board-wrap board-form-wrap">
            <form className="board-form consult-form" onSubmit={onSubmit}>
              {/* 01. 기본 정보 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">01</span>
                  <h3>기본 정보</h3>
                  {!isEdit && (
                    <label className="dev-fill-toggle">
                      <input
                        type="checkbox"
                        checked={devFillChecked}
                        onChange={(e) => onToggleDevFill(e.target.checked)}
                      />
                      관리자 테스트 입력
                    </label>
                  )}
                </div>

                {/* 성함/연락처/Email + 나의 이미지 — 관리자 페이지의 자기소개서 스타일 카드와 같은 배치입니다 */}
                <div className="field-basic-card">
                  <div className="field-basic-rows">
                    <label id="field-name" className={fieldErrors['field-name'] ? 'field-invalid' : undefined}>
                      <FieldLabel required>성함</FieldLabel>
                      <input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="성함" />
                      <FieldErrorMsg id="field-name" errors={fieldErrors} />
                    </label>
                    <label id="field-phone" className={fieldErrors['field-phone'] ? 'field-invalid' : undefined}>
                      <FieldLabel required>연락처</FieldLabel>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(e) => patch({ phone: formatPhoneNumber(e.target.value) })}
                        placeholder="010-0000-0000"
                        maxLength={13}
                      />
                      <FieldErrorMsg id="field-phone" errors={fieldErrors} />
                    </label>
                    <label id="field-email" className={fieldErrors['field-email'] ? 'field-invalid' : undefined}>
                      <FieldLabel required>Email</FieldLabel>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => patch({ email: e.target.value })}
                        placeholder="답변받으실 이메일"
                      />
                      <FieldErrorMsg id="field-email" errors={fieldErrors} />
                    </label>
                  </div>
                  <div className="field-basic-avatar">
                    {/* "나의 이미지" — 아래 "03. 프로젝트 정보"에서 공간 용도를 고르면 그에 맞는 건물 이미지가 여기 바로 표시됩니다 */}
                    <div className={`building-image-box${form.avatar ? ' has-image' : ''}`}>
                      {form.avatar ? (
                        <img src={avatarUrl(form.avatar)} alt="선택한 공간 용도의 건물 이미지" />
                      ) : (
                        <span className="building-image-placeholder">
                          공간 용도를
                          <br />
                          선택하면 표시됩니다
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div id="field-appt" className={`form-row form-row-2${fieldErrors['field-appt'] ? ' field-invalid' : ''}`}>
                  <label>
                    <FieldLabel required>상담 예약 날짜</FieldLabel>
                    <input type="date" value={form.apptDate} onChange={(e) => patch({ apptDate: e.target.value })} />
                  </label>
                  <label>
                    <FieldLabel required>상담 예약 시간</FieldLabel>
                    <input type="time" value={form.apptTime} onChange={(e) => patch({ apptTime: e.target.value })} />
                  </label>
                  <FieldErrorMsg id="field-appt" errors={fieldErrors} />
                </div>

                <div id="field-source" className={`form-field${fieldErrors['field-source'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>뮤아르디자인스튜디오를 알게 된 경로</FieldLabel>
                  <CheckGroup
                    options={SOURCE_CHANNELS}
                    selected={form.sourceChannels}
                    onToggle={(v) => toggle('sourceChannels', v)}
                  />
                  <FieldErrorMsg id="field-source" errors={fieldErrors} />
                  {form.sourceChannels.includes('기타') && (
                    <div className="subfield">
                      <textarea
                        rows={2}
                        value={form.sourceOther}
                        onChange={(e) => patch({ sourceOther: e.target.value })}
                        placeholder="예) 검색, 지인 소개 등 — 구체적인 경로를 적어주세요"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 02. 상담 유형 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">02</span>
                  <h3>상담 유형</h3>
                </div>

                <div id="field-service" className={`form-field${fieldErrors['field-service'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>원하시는 서비스 유형을 선택해 주세요 (복수 선택 가능)</FieldLabel>
                  <div className="service-grid">
                    {SERVICE_TYPES.map((svc) => (
                      <label
                        key={svc.key}
                        className={`service-card${form.serviceTypes.includes(svc.key) ? ' checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.serviceTypes.includes(svc.key)}
                          onChange={() => toggle('serviceTypes', svc.key)}
                        />
                        <span className="service-card-title">{svc.key}</span>
                        {svc.desc && <span className="service-card-desc">{svc.desc}</span>}
                      </label>
                    ))}
                  </div>
                  <FieldErrorMsg id="field-service" errors={fieldErrors} />
                  {form.serviceTypes.includes('기타') && (
                    <div className="subfield">
                      <textarea
                        rows={3}
                        value={form.serviceOther}
                        onChange={(e) => patch({ serviceOther: e.target.value })}
                        placeholder="기타 상담 내용을 자유롭게 적어주세요"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 03. 프로젝트 정보 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">03</span>
                  <h3>프로젝트 정보</h3>
                </div>

                <div id="field-address" className={`form-field${fieldErrors['field-address'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>현장 주소</FieldLabel>
                  <div className="address-row">
                    <input value={form.addressBase} readOnly placeholder="주소 검색을 눌러주세요" />
                    <button type="button" className="btn-outline" onClick={() => void openAddressSearch()}>
                      주소 검색
                    </button>
                  </div>
                  <input
                    id="addr-detail"
                    className="address-detail"
                    value={form.addressDetail}
                    onChange={(e) => patch({ addressDetail: e.target.value })}
                    placeholder="상세 주소 (동/호수 등)"
                  />
                  <FieldErrorMsg id="field-address" errors={fieldErrors} />
                </div>

                <div id="field-space" className={`form-field${fieldErrors['field-space'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>공간 용도</FieldLabel>
                  <div className="space-groups">
                    {SPACE_GROUPS.map((g) => (
                      <div key={g.group} className="space-group">
                        <div className="space-group-title">{g.group}</div>
                        <RadioGroup
                          name="spaceType"
                          options={g.options}
                          value={form.spaceType}
                          onChange={(v) => patch({ spaceType: v })}
                        />
                      </div>
                    ))}
                    <div className="space-group">
                      <RadioGroup name="spaceType" options={['기타']} value={form.spaceType} onChange={(v) => patch({ spaceType: v })} />
                    </div>
                  </div>
                  <FieldErrorMsg id="field-space" errors={fieldErrors} />
                  {form.spaceType === '기타' && (
                    <div className="subfield">
                      <textarea
                        rows={2}
                        value={form.spaceOther}
                        onChange={(e) => patch({ spaceOther: e.target.value })}
                        placeholder="공간의 용도를 간략하게 적어주세요"
                      />
                    </div>
                  )}
                </div>

                <div id="field-area" className={`form-field${fieldErrors['field-area'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>공급면적</FieldLabel>
                  <div className="area-row">
                    <input
                      type="number"
                      min="0"
                      value={form.areaValue}
                      disabled={form.areaUnknown}
                      onChange={(e) => patch({ areaValue: e.target.value })}
                      placeholder="숫자만 입력"
                    />
                    <div className="unit-toggle">
                      {(['평', '㎡'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          className={`unit-btn${form.areaUnit === u ? ' active' : ''}`}
                          disabled={form.areaUnknown}
                          onClick={() => patch({ areaUnit: u })}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.areaUnknown}
                        onChange={(e) => patch({ areaUnknown: e.target.checked, areaValue: e.target.checked ? '' : form.areaValue })}
                      />
                      모름
                    </label>
                  </div>
                  <FieldErrorMsg id="field-area" errors={fieldErrors} />
                  {form.spaceType === '아파트' && (
                    <div className="subfield">
                      <Note>아파트의 경우 타입이 있다면 함께 입력 부탁드립니다.</Note>
                      <input
                        className="text-input"
                        value={form.apartmentType}
                        onChange={(e) => patch({ apartmentType: e.target.value })}
                        placeholder="예) 84A, 84B"
                      />
                    </div>
                  )}
                </div>

                <div className="form-row form-row-2">
                  <div id="field-start" className={`form-field${fieldErrors['field-start'] ? ' field-invalid' : ''}`}>
                    <FieldLabel required>디자인 작업 희망 시작일</FieldLabel>
                    <input
                      className="text-input"
                      type="date"
                      value={form.startDate}
                      disabled={form.startUnset}
                      onChange={(e) => patch({ startDate: e.target.value })}
                    />
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.startUnset}
                        onChange={(e) => patch({ startUnset: e.target.checked, startDate: e.target.checked ? '' : form.startDate })}
                      />
                      일정 미정 / 협의 필요
                    </label>
                    <FieldErrorMsg id="field-start" errors={fieldErrors} />
                  </div>
                  <div id="field-end" className={`form-field${fieldErrors['field-end'] ? ' field-invalid' : ''}`}>
                    <FieldLabel required>디자인 완료 희망일</FieldLabel>
                    <input
                      className="text-input"
                      type="date"
                      value={form.endDate}
                      disabled={form.endUnset}
                      onChange={(e) => patch({ endDate: e.target.value })}
                    />
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.endUnset}
                        onChange={(e) => patch({ endUnset: e.target.checked, endDate: e.target.checked ? '' : form.endDate })}
                      />
                      일정 미정 / 협의 필요
                    </label>
                    <FieldErrorMsg id="field-end" errors={fieldErrors} />
                  </div>
                </div>
              </section>

              {/* 04. 현장 정보 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">04</span>
                  <h3>현장 정보</h3>
                </div>

                <div id="field-plan" className={`form-field${fieldErrors['field-plan'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>보유하고 계신 도면을 선택해 주세요</FieldLabel>
                  <CheckGroup
                    options={PLAN_TYPES}
                    selected={form.planTypes}
                    onToggle={(v) => toggle('planTypes', v, PLAN_EXCLUSIVE)}
                  />
                  <Note>
                    네이버 부동산 등의 간략 평면도가 아닌 치수 확인이 가능한 단위세대 평면도 또는 건축도면을 첨부해 주세요.
                  </Note>
                  <FieldErrorMsg id="field-plan" errors={fieldErrors} />
                  {isEdit && (
                    <ExistingAttachmentList
                      items={existingAttachments.filter((a) => a.field === 'plan')}
                      onRemove={removeExistingAttachment}
                    />
                  )}
                  {form.planTypes.some((v) => PLAN_FILE_TRIGGERS.includes(v)) && (
                    <div className="subfield">
                      <FieldLabel>도면 첨부</FieldLabel>
                      <FileField
                        id="file-plan"
                        files={files.plan}
                        onChange={(list) => setFiles((s) => ({ ...s, plan: list }))}
                        accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                        onOversize={setOversizeName}
                      />
                    </div>
                  )}
                </div>

                <div id="field-sketch" className={`form-field${fieldErrors['field-sketch'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>치수가 기재된 손그림</FieldLabel>
                  <Note>도면이 없는 경우 공간의 형태와 벽체 길이, 문·창문의 위치 및 주요 치수가 표시된 손그림을 첨부해 주세요.</Note>
                  <RadioGroup
                    name="sketchAvailable"
                    options={['첨부 가능', '첨부 어려움']}
                    value={form.sketchAvailable}
                    onChange={(v) => patch({ sketchAvailable: v as FormState['sketchAvailable'] })}
                  />
                  <FieldErrorMsg id="field-sketch" errors={fieldErrors} />
                  {isEdit && (
                    <ExistingAttachmentList
                      items={existingAttachments.filter((a) => a.field === 'sketch')}
                      onRemove={removeExistingAttachment}
                    />
                  )}
                  {form.sketchAvailable === '첨부 가능' && (
                    <div className="subfield">
                      <FieldLabel>손그림 첨부</FieldLabel>
                      <FileField
                        id="file-sketch"
                        files={files.sketch}
                        onChange={(list) => setFiles((s) => ({ ...s, sketch: list }))}
                        accept="image/*,.pdf"
                        onOversize={setOversizeName}
                      />
                    </div>
                  )}
                </div>

                <div id="field-sitemedia" className={`form-field${fieldErrors['field-sitemedia'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>현장 사진 및 동영상</FieldLabel>
                  <Note>
                    평면도만으로 확인하기 어려운 기둥, 보, 창호, 설비, 단차, 기존 마감 및 현장 구조 등을 파악하기 위한
                    자료입니다. 실제 현장 여건에 따라 공간 활용 및 설계 방향이 달라질 수 있습니다.
                  </Note>
                  <CheckGroup
                    options={SITE_MEDIA_OPTIONS}
                    selected={form.siteMedia}
                    onToggle={(v) => toggle('siteMedia', v, SITE_MEDIA_EXCLUSIVE)}
                  />
                  <FieldErrorMsg id="field-sitemedia" errors={fieldErrors} />
                  {isEdit && (
                    <ExistingAttachmentList
                      items={existingAttachments.filter((a) => a.field === 'site')}
                      onRemove={removeExistingAttachment}
                    />
                  )}
                  {form.siteMedia.some((v) => SITE_MEDIA_FILE_TRIGGERS.includes(v)) && (
                    <div className="subfield">
                      <FieldLabel>현장 사진 및 동영상 첨부</FieldLabel>
                      <FileField
                        id="file-site"
                        files={files.site}
                        onChange={(list) => setFiles((s) => ({ ...s, site: list }))}
                        accept="image/*,video/*"
                        onOversize={setOversizeName}
                      />
                      <Note>동영상 용량이 큰 경우 첨부가 어려울 수 있습니다. 그런 경우 기타 전달사항에 공유 링크를 남겨주세요.</Note>
                    </div>
                  )}
                </div>

                <div id="field-ceiling" className={`form-field${fieldErrors['field-ceiling'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>천장 높이</FieldLabel>
                  <div className="area-row area-row-wide">
                    <input
                      type="number"
                      min="0"
                      value={form.ceilingHeight}
                      disabled={form.ceilingUnknown}
                      onChange={(e) => patch({ ceilingHeight: e.target.value })}
                      placeholder="약 얼마인지 숫자만 입력"
                    />
                    <span className="unit-suffix">mm</span>
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.ceilingUnknown}
                        onChange={(e) => patch({ ceilingUnknown: e.target.checked, ceilingHeight: e.target.checked ? '' : form.ceilingHeight })}
                      />
                      모름
                    </label>
                  </div>
                  <FieldErrorMsg id="field-ceiling" errors={fieldErrors} />
                </div>

                <div id="field-sitenotes" className={`form-field${fieldErrors['field-sitenotes'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>기타 현장 특이사항</FieldLabel>
                  <p className="form-note">현장에서 미리 확인이 필요한 구조나 설비, 유지해야 하는 시설물 등 특이사항이 있다면 작성해 주세요.</p>
                  {!form.siteNotesNone && (
                    <textarea
                      rows={4}
                      value={form.siteNotes}
                      onChange={(e) => patch({ siteNotes: e.target.value })}
                      placeholder="예) 철거 불가 벽체, 기존 설비 위치 등"
                    />
                  )}
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.siteNotesNone}
                      onChange={(e) => patch({ siteNotesNone: e.target.checked, siteNotes: e.target.checked ? '' : form.siteNotes })}
                    />
                    특이사항 없음
                  </label>
                  <FieldErrorMsg id="field-sitenotes" errors={fieldErrors} />
                </div>
              </section>

              {/* 05. 디자인 요청사항 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">05</span>
                  <h3>디자인 요청사항</h3>
                </div>

                <div id="field-styles" className={`form-field${fieldErrors['field-styles'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>희망하는 디자인 스타일</FieldLabel>
                  <CheckGroup options={STYLE_OPTIONS} selected={form.styles} onToggle={(v) => toggle('styles', v)} />
                  <FieldErrorMsg id="field-styles" errors={fieldErrors} />
                  {form.styles.includes('기타') && (
                    <div className="subfield">
                      <textarea
                        rows={2}
                        value={form.styleOther}
                        onChange={(e) => patch({ styleOther: e.target.value })}
                        placeholder="원하시는 스타일이 위 항목에 없다면 자유롭게 작성해 주세요"
                      />
                    </div>
                  )}
                </div>

                <div id="field-references" className={`form-field${fieldErrors['field-references'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>참고하고 있는 디자인 또는 레퍼런스</FieldLabel>
                  <CheckGroup
                    options={REFERENCE_OPTIONS}
                    selected={form.references}
                    onToggle={(v) => toggle('references', v, REFERENCE_EXCLUSIVE)}
                  />
                  <FieldErrorMsg id="field-references" errors={fieldErrors} />
                  {isEdit && (
                    <ExistingAttachmentList
                      items={existingAttachments.filter((a) => a.field === 'reference')}
                      onRemove={removeExistingAttachment}
                    />
                  )}
                  {form.references.includes('이미지 첨부') && (
                    <div className="subfield">
                      <FieldLabel>디자인 레퍼런스 첨부</FieldLabel>
                      <FileField
                        id="file-reference"
                        files={files.reference}
                        onChange={(list) => setFiles((s) => ({ ...s, reference: list }))}
                        accept="image/*,.pdf"
                        onOversize={setOversizeName}
                      />
                    </div>
                  )}
                  {form.references.includes('Pinterest / SNS 등 링크 첨부') && (
                    <div className="subfield">
                      <FieldLabel>디자인 레퍼런스 URL</FieldLabel>
                      <input
                        className="text-input"
                        value={form.referenceUrl}
                        onChange={(e) => patch({ referenceUrl: e.target.value })}
                        placeholder="https://pinterest.com/..."
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <label id="field-spacerequests" className={fieldErrors['field-spacerequests'] ? 'field-invalid' : undefined}>
                    <FieldLabel required>공간별 요청사항</FieldLabel>
                    <p className="form-note">각 공간의 사용 목적, 필요한 기능, 가구 및 집기, 원하는 분위기 등 디자인에 반영되었으면 하는 내용을 자유롭게 작성해 주세요.</p>
                    <textarea
                      rows={6}
                      value={form.spaceRequests}
                      onChange={(e) => patch({ spaceRequests: e.target.value })}
                      placeholder="예) 거실은 아이와 함께 놀 수 있는 넓은 공간으로, 주방은 수납이 넉넉하게..."
                    />
                    <FieldErrorMsg id="field-spacerequests" errors={fieldErrors} />
                  </label>
                </div>

                <div id="field-othernotes" className={`form-field${fieldErrors['field-othernotes'] ? ' field-invalid' : ''}`}>
                  <FieldLabel required>기타 전달사항</FieldLabel>
                  <p className="form-note">상담 전 미리 전달하고 싶은 내용이나 특별히 확인이 필요한 사항이 있다면 작성해 주세요.</p>
                  {!form.otherNotesNone && (
                    <textarea
                      rows={4}
                      value={form.otherNotes}
                      onChange={(e) => patch({ otherNotes: e.target.value })}
                    />
                  )}
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.otherNotesNone}
                      onChange={(e) => patch({ otherNotesNone: e.target.checked, otherNotes: e.target.checked ? '' : form.otherNotes })}
                    />
                    별도 전달사항 없음
                  </label>
                  <FieldErrorMsg id="field-othernotes" errors={fieldErrors} />
                </div>
              </section>

              {/* 06. 추가 자료 첨부 */}
              <section className="form-section">
                <div className="form-section-head">
                  <span className="form-section-num">06</span>
                  <h3>추가 자료 첨부</h3>
                </div>
                <p className="form-note">상담에 참고할 수 있는 자료가 있다면 자유롭게 첨부해 주세요. 예) 기존 설계자료, 가구·집기 리스트, 마감재 자료, 현장 관련 자료 등 (선택)</p>
                {isEdit && (
                  <ExistingAttachmentList
                    items={existingAttachments.filter((a) => a.field === 'extra')}
                    onRemove={removeExistingAttachment}
                  />
                )}
                <FileField
                  id="file-extra"
                  files={files.extra}
                  onChange={(list) => setFiles((s) => ({ ...s, extra: list }))}
                  onOversize={setOversizeName}
                />
              </section>

              {/* 확인 및 등록 */}
              <section className="form-section">
                {isEdit ? (
                  <div className="form-row">
                    <label className="form-checkbox-label">
                      <input type="checkbox" checked={form.isSecret} onChange={(e) => patch({ isSecret: e.target.checked })} />
                      비밀글로 남기기 (권장)
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="form-row form-row-2">
                      <label id="field-password" className={fieldErrors['field-password'] ? 'field-invalid' : undefined}>
                        <FieldLabel required>비밀번호</FieldLabel>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => patch({ password: e.target.value })}
                          placeholder="글 확인 시 사용할 비밀번호"
                        />
                        <FieldErrorMsg id="field-password" errors={fieldErrors} />
                      </label>
                      <label className="form-checkbox-label">
                        <input type="checkbox" checked={form.isSecret} onChange={(e) => patch({ isSecret: e.target.checked })} />
                        비밀글로 남기기 (권장)
                      </label>
                    </div>

                    <label
                      id="field-agree"
                      className={`form-checkbox-label form-agree${fieldErrors['field-agree'] ? ' field-invalid' : ''}`}
                    >
                      <input type="checkbox" checked={form.agree} onChange={(e) => patch({ agree: e.target.checked })} />
                      남겨주신 정보는 상담 목적으로만 사용되며, 상담 종료 후 별도 요청 시 삭제됩니다. 개인정보 수집 및 이용에
                      동의합니다.
                    </label>
                    <FieldErrorMsg id="field-agree" errors={fieldErrors} />
                  </>
                )}

                {oversizeName && (
                  <div className="form-error">{oversizeName}의 용량이 너무 커서 첨부되지 않았습니다 (50MB 이하만 가능).</div>
                )}

                {submitError && <div className="form-error">{submitError}</div>}

                <div className="form-actions">
                  <Link to={isEdit && id ? `/consult/${id}` : '/consult'} className="link-underline">
                    {isEdit ? '← 글로 돌아가기' : '← 목록으로'}
                  </Link>
                  <button type="submit" className="btn-solid" disabled={submitting}>
                    {submitting ? (isEdit ? '수정 중…' : '등록 중…') : isEdit ? '수정 완료' : '등록하기'}
                  </button>
                </div>
              </section>
            </form>
        </div>
      </div>

      <Footer site={content.site} contact={content.contact} />
    </>
  )
}
