import type { SiteMeta, ContactContent } from '../lib/types'

/** 관리자 화면에서 값을 비워두면 쓸 기본 카카오 채널 주소 */
const KAKAO_FALLBACK_URL = 'https://pf.kakao.com/_AkFen'

export default function Footer({
  site,
  contact,
}: {
  site: SiteMeta
  contact: ContactContent
}) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-row">
          <div className="wordmark">
            <img src="/images/muare-mark.png" alt="" className="wordmark-icon" />
            {site.wordmark}
          </div>
          <div className="footer-links">
            <a
              href={contact.instagram || '#'}
              target={contact.instagram ? '_blank' : undefined}
              rel="noreferrer"
            >
              Instagram
            </a>
            <a href={`mailto:${contact.email}`}>Email</a>
            <a href={contact.kakao || KAKAO_FALLBACK_URL} target="_blank" rel="noreferrer">
              Kakao
            </a>
          </div>
        </div>
        <div className="footer-copy">{site.copyright}</div>
      </div>
    </footer>
  )
}
