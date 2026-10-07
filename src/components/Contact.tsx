import { Link } from 'react-router-dom'
import type { ContactContent } from '../lib/types'
import Reveal from './Reveal'
import FloralMark from './FloralMark'

/** 관리자 화면에서 값을 비워두면 쓸 기본 카카오 채널 주소 */
const KAKAO_FALLBACK_URL = 'https://pf.kakao.com/_AkFen'

export default function Contact({ contact }: { contact: ContactContent }) {
  return (
    <section className="cta section-watermark" id="contact">
      <FloralMark />
      <img
        src="/images/muare-mark-light.png"
        alt=""
        className="section-watermark-mark"
        aria-hidden="true"
      />
      <div className="wrap">
        <Reveal>
          <h2>{contact.heading}</h2>
          <p>{contact.subtitle}</p>
          <div className="cta-btn-row">
            <a href={contact.kakao || KAKAO_FALLBACK_URL} target="_blank" rel="noreferrer" className="cta-btn">
              카카오톡 상담
            </a>
            <Link to="/consult" className="cta-btn cta-btn-ghost">
              <svg className="cta-btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="4" y="2.5" width="12" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 7h6M7 10.2h6M7 13.4h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              상담게시판
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
