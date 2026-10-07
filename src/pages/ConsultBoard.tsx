import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useSiteContent } from '../hooks/useSiteData'
import { listConsultations, type ConsultListItem } from '../lib/consultService'

const PAGE_SIZE = 12

function maskName(name: string) {
  if (name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 상담게시판 — 의뢰자가 자유롭게 상담 글을 남기고, 필요하면 비밀글로 보호할 수 있는 게시판입니다 */
export default function ConsultBoard() {
  const { content } = useSiteContent()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ConsultListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listConsultations(page, PAGE_SIZE).then((res) => {
      if (cancelled) return
      setItems(res.items)
      setTotal(res.total)
      setError(res.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <Header site={content.site} />

      <div className="board-page">
        <div className="wrap archive-head">
          <Reveal>
            <div className="eyebrow-plain">Consult</div>
            <h1 className="section-title">상담게시판</h1>
            <p className="board-intro">
              프로젝트가 궁금하신 내용을 자유롭게 남겨주세요. 비밀글로 남기시면 작성 시 입력한 비밀번호로만 내용을 확인할
              수 있습니다.
            </p>
          </Reveal>
        </div>

        <div className="wrap board-wrap">
          <div className="board-toolbar">
            <span className="board-count">전체 {total}건</span>
            <button type="button" className="btn-solid" onClick={() => navigate('/consult/write')}>
              글쓰기
            </button>
          </div>

          {error ? (
            <div className="board-empty">{error}</div>
          ) : loading ? (
            <div className="board-empty">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="board-empty">아직 등록된 상담글이 없습니다. 첫 글을 남겨보세요.</div>
          ) : (
            <div className="board-table-card">
              <table className="board-table">
                <thead>
                  <tr>
                    <th className="col-num">번호</th>
                    <th className="col-title">제목</th>
                    <th className="col-name">작성자</th>
                    <th className="col-date">날짜</th>
                    <th className="col-status">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} onClick={() => navigate(`/consult/${it.id}`)}>
                      <td className="col-num">{total - ((page - 1) * PAGE_SIZE + i)}</td>
                      <td className="col-title">
                        {it.is_secret && <span className="board-lock">🔒</span>}
                        {it.title}
                      </td>
                      <td className="col-name">{maskName(it.name)}</td>
                      <td className="col-date">{formatDate(it.created_at)}</td>
                      <td className="col-status">
                        <span className={`status-pill${it.status === '답변완료' ? ' done' : ''}`}>{it.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="page-arrow"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="이전 페이지"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`page-num${n === page ? ' active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="page-arrow"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="다음 페이지"
              >
                →
              </button>
            </div>
          )}

          <div className="board-back-row">
            <Link to="/" className="link-underline">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      <Footer site={content.site} contact={content.contact} />
    </>
  )
}
