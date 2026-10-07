import { Link } from 'react-router-dom'
import type { AboutContent } from '../lib/types'
import Reveal from './Reveal'

export default function About({ about }: { about: AboutContent }) {
  return (
    <section id="about" className="divider section-watermark">
      <img src="/images/muare-mark.png" alt="" className="section-watermark-mark" aria-hidden="true" />
      <div className="wrap about-grid">
        <Reveal className="about-photo">
          <img src={about.image} alt={about.imageAlt} loading="lazy" />
        </Reveal>
        <Reveal className="about-copy" delay={80}>
          <div className="eyebrow-plain">{about.eyebrow}</div>
          <h2 className="section-title">{about.heading}</h2>
          {about.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
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
