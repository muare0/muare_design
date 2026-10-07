import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Linkified from '../components/Linkified'
import AttachmentGallery from '../components/AttachmentGallery'
import {
  adminListReplies,
  adminAddReply,
  avatarUrl,
  type AnswerSection,
  type ConsultAttachment,
  type ConsultReply,
} from '../lib/consultService'

interface Row {
  id: string
  created_at: string
  name: string
  phone: string | null
  email: string | null
  title: string
  content: string
  attachments: ConsultAttachment[]
  answers: AnswerSection[]
  is_secret: boolean
  status: string
  avatar: string
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

/** 작성자/전화번호/이메일 — 상담 내용 맨 위(01 기본정보/상담예약보다 위)에 자기소개서처럼 보여줍니다.
 *  왼쪽엔 항목을 한 줄씩(라벨 + 값 박스), 오른쪽엔 나의 이미지(아바타)를 큼직하게 — 게시판 전체에서
 *  쓰는 카드 테두리·라벨·값 박스 스타일(consult-answer-*)을 그대로 재사용해서 통일감을 맞췄습니다. */
function ContactInfo({ row }: { row: Row }) {
  const items: { label: string; value: string }[] = [
    { label: '작성자', value: row.name },
    ...(row.phone ? [{ label: '전화번호', value: row.phone }] : []),
    ...(row.email ? [{ label: '이메일', value: row.email }] : []),
  ]
  return (
    <div className="consult-contact-card">
      <div className="consult-contact-rows">
        {items.map((it) => (
          <div key={it.label} className="consult-contact-row">
            <div className="consult-answer-label">{it.label}</div>
            <div className="consult-answer-value consult-contact-row-value">{it.value}</div>
          </div>
        ))}
      </div>
      {row.avatar && (
        <div className="consult-contact-photo">
          <img src={avatarUrl(row.avatar)} alt="" />
        </div>
      )}
    </div>
  )
}

/** 체크리스트 답변 한 섹션 — 항목 제목(라벨)과 방문자가 실제로 입력한 값을 뚜렷하게 구분해서 보여줍니다 */
function AnswerSectionBlock({ section }: { section: AnswerSection }) {
  return (
    <div className="consult-answer-section">
      <div className="consult-answer-section-head">
        <span className="consult-answer-num">{section.num}</span>
        <h4>{section.title}</h4>
      </div>
      <div className="consult-answer-grid">
        {section.fields.map((f, i) => (
          <div key={i} className="consult-answer-item">
            <div className="consult-answer-label">{f.label}</div>
            {f.value.trim() ? (
              <div className="consult-answer-value">
                <Linkified text={f.value} />
              </div>
            ) : (
              <div className="consult-answer-value empty">입력 없음</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 상담게시판 관리 — 로그인한 관리자만 전체 내용을 볼 수 있습니다.
 * (일반 방문자는 비밀글의 본문을 절대 볼 수 없고, 관리자만 볼 수 있도록
 *  Supabase 쪽 RLS 정책이 admins 테이블 기준으로 설정되어 있어야 합니다.
 *  supabase-consultations.sql 참고)
 */
export default function Consultations({ onToast }: { onToast: (m: string) => void }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 답변 댓글창 — 관리자와 작성자가 여러 번 주고받는 댓글 형태의 답변
  const [replies, setReplies] = useState<ConsultReply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [newReply, setNewReply] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  async function load() {
    if (!supabase) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('consultations')
      .select('id, created_at, name, phone, email, title, content, attachments, answers, is_secret, status, avatar')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setRows((data ?? []) as Row[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function loadReplies(id: string) {
    setRepliesLoading(true)
    const res = await adminListReplies(id)
    setRepliesLoading(false)
    if (res.error) {
      onToast(res.error)
      return
    }
    setReplies(res.items)
  }

  function toggle(row: Row) {
    if (openId === row.id) {
      setOpenId(null)
      return
    }
    setOpenId(row.id)
    setNewReply('')
    setReplies([])
    void loadReplies(row.id)
  }

  async function postReply(row: Row) {
    if (!newReply.trim()) return
    setPostingReply(true)
    const res = await adminAddReply(row.id, newReply.trim())
    setPostingReply(false)
    if (!res.ok) {
      onToast(res.error || '답변 등록에 실패했습니다.')
      return
    }
    setNewReply('')
    onToast('답변을 등록했습니다.')
    await loadReplies(row.id)
    await load()
  }

  /** 관리자 글 삭제 — 첨부파일 자체는 스토리지에서 함께 지워지지 않는 점 참고 */
  async function deleteRow(row: Row) {
    if (!supabase) return
    if (!window.confirm(`"${row.title}" 글을 정말 삭제하시겠습니까?\n삭제한 글은 되돌릴 수 없습니다.`)) return
    setDeletingId(row.id)
    const { error: err } = await supabase.from('consultations').delete().eq('id', row.id)
    setDeletingId(null)
    if (err) {
      onToast(err.message)
      return
    }
    onToast('글을 삭제했습니다.')
    if (openId === row.id) setOpenId(null)
    await load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          {/* 제목을 누르면 열려 있던 글을 모두 접고 목록 화면으로 돌아갑니다 */}
          <h1
            className="admin-title admin-title-clickable"
            role="button"
            tabIndex={0}
            onClick={() => setOpenId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setOpenId(null)
            }}
          >
            Consultations
          </h1>
          <p className="admin-desc">상담게시판에 남겨진 글을 확인하고 답변을 남깁니다. 비밀글도 관리자에게는 모두 보입니다.</p>
        </div>
      </div>

      <div className="admin-board-page">
        {error && <div className="upload-status err">{error}</div>}
        {loading ? (
          <div className="admin-desc">불러오는 중…</div>
        ) : rows.length === 0 ? (
          <div className="admin-desc">아직 등록된 상담글이 없습니다.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="proj-row" style={{ display: 'block', cursor: 'pointer' }}>
              <div className="consult-row-head" onClick={() => toggle(row)}>
                <div className="proj-name consult-row-title">
                  {row.is_secret ? '🔒 ' : ''}
                  {row.title}
                </div>
                <div className="proj-sub consult-row-meta">
                  {row.name} · {new Date(row.created_at).toLocaleDateString('ko-KR')}
                </div>
                <span className={`badge${row.status === '답변완료' ? ' on' : ''}`}>{row.status}</span>
                <button
                  type="button"
                  className="btn danger sm consult-row-delete"
                  disabled={deletingId === row.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    void deleteRow(row)
                  }}
                >
                  {deletingId === row.id ? '삭제 중…' : '삭제'}
                </button>
              </div>

              {openId === row.id && (
                <div className="consult-detail-panel">
                  <div className="consult-block-head">상담 내용</div>
                  <ContactInfo row={row} />
                  {row.answers && row.answers.length > 0 ? (
                    <div className="consult-answers">
                      {row.answers.map((section) => (
                        <AnswerSectionBlock key={section.num} section={section} />
                      ))}
                    </div>
                  ) : (
                    <p className="consult-legacy-content">
                      <Linkified text={row.content} />
                    </p>
                  )}

                  <AttachmentGallery items={row.attachments} />

                  <div className="consult-block-head consult-reply-head">답변</div>
                  {repliesLoading ? (
                    <div className="consult-thread-empty">불러오는 중…</div>
                  ) : replies.length === 0 ? (
                    <div className="consult-thread-empty">아직 답변이 없습니다.</div>
                  ) : (
                    <ul className="consult-thread-list">
                      {replies.map((r) => (
                        <li key={r.id} className={`consult-thread-item ${r.author}`}>
                          <div className="consult-thread-meta">
                            <span className="consult-thread-author">{r.author === 'admin' ? '관리자' : row.name}</span>
                            <span className="consult-thread-date">{formatDateTime(r.created_at)}</span>
                          </div>
                          <div className="consult-thread-body">
                            <Linkified text={r.content} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="field consult-reply-field">
                    <label>답변 작성</label>
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="의뢰자에게 남길 답변을 입력하세요."
                    />
                  </div>
                  <button
                    type="button"
                    className="btn sm consult-reply-submit"
                    style={{ marginTop: 10 }}
                    disabled={postingReply || !newReply.trim()}
                    onClick={() => void postReply(row)}
                  >
                    {postingReply ? '등록 중…' : '답변 등록'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
