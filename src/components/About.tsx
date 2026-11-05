import { Link } from 'react-router-dom'
import type { AboutContent } from '../lib/types'
import Reveal from './Reveal'

export default function About({ about }: { about: AboutContent }) {
  return (
    <section id="about" className="divider section-watermark">
      <style>{`#about .about-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);align-items:stretch;gap:clamp(32px,5vw,72px)}
#about .about-photo{aspect-ratio:auto;min-height:620px;position:relative}
#about .about-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#about .about-copy{min-width:0}
#about .about-copy p{max-width:none;line-height:1.85;margin-top:22px}
#about .about-copy p strong{display:block;color:var(--text);font-size:1.12em;font-weight:600;margin-bottom:7px;line-height:1.5}
@media(max-width:900px){#about .about-grid{grid-template-columns:minmax(0,1fr)}#about .about-photo{min-height:0;aspect-ratio:4/5;max-height:620px}#about .about-copy p{margin-top:20px}}`}</style>
      <img src="/images/muare-mark.png" alt="" className="section-watermark-mark" aria-hidden="true" />
      <div className="wrap about-grid">
        <Reveal className="about-photo">
          <img src={about.image} alt={about.imageAlt} loading="lazy" />
        </Reveal>
        <Reveal className="about-copy" delay={80}>
          <div className="eyebrow-plain">{about.eyebrow}</div>
          <h2 className="section-title">{about.heading}</h2>
          {about.body.map((p, i) => {
            const [lead, ...body] = p.split('\n')
            return (
              <p key={i}>
                {body.length ? <><strong>{lead}</strong>{body.join('\n')}</> : p}
              </p>
            )
          })}
          <Link to="/service" className="service-more">
            서비스 자세히 보기
            <span className="service-more-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
