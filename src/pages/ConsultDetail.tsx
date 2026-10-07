import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import Linkified from '../components/Linkified'
import AttachmentGallery from '../components/AttachmentGallery'
import { useSiteContent } from '../hooks/useSiteData'
import {
  getConsultation,
  getConsultationMeta,
  deleteConsultation,
  listConsultReplies,
  addConsultReply,
  avatarUrl,
  type ConsultFull,
  type ConsultListItem,
  type ConsultReply,
  type AnswerSection,
} from '../lib/consultService'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = formatDate(iso)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

/** 작성자/전화번호/이메일 + 나의 이미지 — 관리자 페이지와 같은 자기소개서 스타일 카드 */
function ContactCard({ item }: { item: ConsultFull }) {
  const items: { label: string; value: string }[] = [
    { label: '작성자', value: item.name },
    ...(item.phone ? [{ label: '전화번호', value: item.phone }] : []),
    ...(item.email ? [{ label: '이메일', value: item.email }] : []),
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
      {item.avatar && (
        <div className="consult-contact-photo">
          <img src={avatarUrl(item.avatar)} alt="" />
        </div>
      )}
    </div>
  )
}

/** 체크리스트 답변 한 섹션 — 관리자 페이지와 동일한 번호 배지 + 라벨/값 박스 스타일 */
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

/** 상담게시판 — 글 상세보기. 비밀글이면 비밀번호가 맞아야 내용이 보입니다 */
export default function ConsultDetail() {
  const { content } = useSiteContent()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const passedState = location.state as
    | { justPosted?: boolean; password?: string; uploadWarning?: string[] }
    | null

  const [meta, setMeta] = useState<ConsultListItem | null>(null)
  const [item, setItem] = useState<ConsultFull | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  // 글 수정/삭제 — 로그인 계정이 없는 게시판이라, 작성 시 입력한 비밀번호로 본인 확인을 합니다.
  const [knownPassword, setKnownPassword] = useState(passedState?.password ?? '')
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | 'reply' | null>(null)
  const [actionPassword, setActionPassword] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 답변 댓글창 — 관리자와 작성자가 여러 번 주고받는 댓글 형태의 답변
  const [replies, setReplies] = useState<ConsultReply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyPosting, setReplyPosting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  async function refreshReplies(pw: string) {
    if (!id) return
    setRepliesLoading(true)
    const res = await listConsultReplies(id, pw)
    setRepliesLoading(false)
    if (!res.error) setReplies(res.items)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void getConsultationMeta(id).then(async (m) => {
      if (cancelled) return
      setMeta(m)
      if (!m) {
        setLoading(false)
        return
      }
      // 공개글이거나, 방금 작성 직후 비밀번호를 이미 알고 있으면 바로 내용을 불러옵니다
      if (!m.is_secret) {
        const res = await getConsultation(id, '')
        if (!cancelled) {
          setItem(res.item)
          setError(res.error)
          setLoading(false)
          void refreshReplies('')
        }
      } else if (passedState?.justPosted && passedState.password) {
        const res = await getConsultation(id, passedState.password)
        if (!cancelled) {
          setItem(res.item)
          setError(res.error)
          setLoading(false)
          void refreshReplies(passedState.password)
        }
      } else {
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onCheckPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !password.trim()) return
    setChecking(true)
    setError(null)
    const res = await getConsultation(id, password.trim())
    setChecking(false)
    if (!res.item) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setItem(res.item)
    setKnownPassword(password.trim())
    void refreshReplies(password.trim())
  }

  /** 수정/삭제/답변 작성 버튼을 눌렀을 때 — 이미 확인된 비밀번호가 있으면 바로 진행하고, 없으면 입력을 먼저 받습니다 */
  function requestAction(action: 'edit' | 'delete' | 'reply') {
    setActionError(null)
    if (knownPassword) {
      void runAction(action, knownPassword)
      return
    }
    setActionPassword('')
    setPendingAction(action)
  }

  async function runAction(action: 'edit' | 'delete' | 'reply', pw: string) {
    if (!id) return
    if (action === 'edit') {
      navigate(`/consult/${id}/edit`, { state: { password: pw } })
      return
    }
    if (action === 'reply') {
      // 비밀번호 확인만 하고, 실제 댓글 등록은 아래 댓글 입력창에서 따로 진행합니다.
      setKnownPassword(pw)
      return
    }
    if (!window.confirm('정말 삭제하시겠습니까? 삭제한 글은 되돌릴 수 없습니다.')) return
    setDeleting(true)
    setActionError(null)
    const res = await deleteConsultation(id, pw)
    setDeleting(false)
    if (!res.ok) {
      setActionError(res.error || '비밀번호가 일치하지 않습니다.')
      setPendingAction('delete')
      return
    }
    navigate('/consult')
  }

  async function onSubmitActionPassword(e: FormEvent) {
    e.preventDefault()
    if (!pendingAction || !actionPassword.trim()) return
    const action = pendingAction
    const pw = actionPassword.trim()
    setPendingAction(null)
    setActionPassword('')
    await runAction(action, pw)
  }

  async function onSubmitReply(e: FormEvent) {
    e.preventDefault()
    if (!id || !replyText.trim() || !knownPassword) return
    setReplyPosting(true)
    setReplyError(null)
    const res = await addConsultReply(id, knownPassword, replyText.trim())
    setReplyPosting(false)
    if (!res.ok) {
      setReplyError(res.error || '답변 등록에 실패했습니다.')
      return
    }
    setReplyText('')
    await refreshReplies(knownPassword)
  }

  return (
    <>
      <Header site={content.site} />

      <div className="board-page">
        <div className="wrap archive-head">
          <Reveal>
            <div className="eyebrow-plain">Consult</div>
            <h1 className="section-title">
              <Link to="/consult" className="consult-title-link">
                상담글 보기
              </Link>
            </h1>
          </Reveal>
        </div>

        <div className="wrap board-wrap board-detail-wrap">
          {loading ? (
            <div className="board-empty">불러오는 중…</div>
          ) : !meta ? (
            <div className="board-empty">존재하지 않는 글입니다.</div>
          ) : item ? (
            <Reveal>
              <article className="consult-detail">
                <div className="consult-detail-head">
                  <div className="consult-detail-head-row">
                    <h2>{item.title}</h2>
                    <div className="consult-detail-meta">
                      <span>{item.name}</span>
                      <span>{formatDate(item.created_at)}</span>
                      <span className={`status-pill${item.status === '답변완료' ? ' done' : ''}`}>{item.status}</span>
                    </div>
                  </div>
                </div>

                <div className="consult-detail-actions">
                  <div className="consult-detail-actions-left">
                    <button type="button" className="btn-outline" onClick={() => requestAction('edit')}>
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn-outline danger"
                      onClick={() => requestAction('delete')}
                      disabled={deleting}
                    >
                      {deleting ? '삭제 중…' : '삭제'}
                    </button>
                  </div>
                  <Link to="/consult" className="btn-outline consult-list-btn">
                    목록
                  </Link>
                </div>

                {pendingAction && (
                  <div className="consult-action-prompt">
                    <p>본인 확인을 위해 작성 시 입력한 비밀번호를 입력해 주세요.</p>
                    <form className="consult-action-prompt-form" onSubmit={onSubmitActionPassword}>
                      <input
                        type="password"
                        value={actionPassword}
                        onChange={(e) => setActionPassword(e.target.value)}
                        placeholder="비밀번호"
                        autoFocus
                      />
                      <button type="submit" className="btn-solid consult-confirm-btn">
                        확인
                      </button>
                      <button type="button" className="btn-cancel" onClick={() => setPendingAction(null)}>
                        취소
                      </button>
                    </form>
                    {actionError && <div className="form-error">{actionError}</div>}
                  </div>
                )}

                {passedState?.justPosted && passedState.uploadWarning && passedState.uploadWarning.length > 0 && (
                  <div className="consult-upload-warning">
                    다음 첨부파일은 용량 문제 등으로 저장되지 못했습니다: {passedState.uploadWarning.join(', ')}. 다시 첨부해서
                    보내주시거나, 담당자에게 직접 전달해 주세요.
                  </div>
                )}

                <ContactCard item={item} />

                <div className="consult-detail-body-label">문의 내용</div>
                {item.answers && item.answers.length > 0 ? (
                  <div className="consult-detail-answers">
                    {item.answers.map((section) => (
                      <AnswerSectionBlock key={section.num} section={section} />
                    ))}
                  </div>
                ) : (
                  <div className="consult-detail-body">
                    <Linkified text={item.content} />
                  </div>
                )}

                {item.attachments && item.attachments.length > 0 && (
                  <div className="consult-detail-attachments">
                    <AttachmentGallery items={item.attachments} />
                  </div>
                )}

                <div className="consult-reply-thread">
                  <div className="consult-reply-divider" />
                  {repliesLoading ? (
                    <div className="consult-thread-empty">불러오는 중…</div>
                  ) : replies.length === 0 ? (
                    <div className="consult-thread-empty">아직 답변이 없습니다.</div>
                  ) : (
                    <ul className="consult-thread-list">
                      {replies.map((r) => (
                        <li key={r.id} className={`consult-thread-item ${r.author}`}>
                          <div className="consult-thread-meta">
                            <span className="consult-thread-author">
                              {r.author === 'admin' ? '뮤아르디자인스튜디오' : item.name}
                            </span>
                            <span className="consult-thread-date">{formatDateTime(r.created_at)}</span>
                          </div>
                          <div className="consult-thread-body">
                            <Linkified text={r.content} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {knownPassword ? (
                    <form className="consult-thread-form" onSubmit={onSubmitReply}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="답변을 남겨주세요"
                        rows={3}
                      />
                      <button type="submit" className="btn-solid" disabled={replyPosting || !replyText.trim()}>
                        {replyPosting ? '등록 중…' : '답변 등록'}
                      </button>
                    </form>
                  ) : (
                    <button type="button" className="btn-outline" onClick={() => requestAction('reply')}>
                      답변 작성하기
                    </button>
                  )}
                  {replyError && <div className="form-error">{replyError}</div>}
                </div>
              </article>
            </Reveal>
          ) : (
            <Reveal>
              <div className="consult-lock">
                <p>비밀글입니다. 작성 시 입력한 비밀번호를 입력해 주세요.</p>
                <form className="consult-lock-form" onSubmit={onCheckPassword}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                  />
                  <button type="submit" className="btn-solid" disabled={checking}>
                    {checking ? '확인 중…' : '확인'}
                  </button>
                </form>
                {error && <div className="form-error">{error}</div>}
              </div>
            </Reveal>
          )}

          <div className="board-back-row">
            <Link to="/consult" className="link-underline">
              ← 목록으로
            </Link>
          </div>
        </div>
      </div>

      <Footer site={content.site} contact={content.contact} />
    </>
  )
}
