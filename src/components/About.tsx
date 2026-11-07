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
#about .section-watermark-mark{top:auto;bottom:40px;transform:none;right:8px;width:clamp(240px,42vw,640px);max-width:calc(100% - 16px);max-height:calc(100% - 80px);object-fit:contain}
@media(max-width:900px){#about .section-watermark-mark{right:8px;width:min(70vw,360px)}}
#about .about-specialties{font-size:11px;line-height:1.8;letter-spacing:.025em}
#about .about-specialties::before{flex-shrink:0}
#about .about-copy .section-title{white-space:pre-line;word-break:keep-all;overflow-wrap:anywhere;line-height:1.35;font-size:clamp(28px,3vw,42px)}
#about .about-copy p{max-width:none;line-height:1.9;margin-top:28px;white-space:pre-line;word-break:normal;overflow-wrap:break-word;text-wrap:pretty}
#about .about-copy p strong{color:var(--text);font-size:inherit;font-weight:650}
#about .about-strengths{list-style:none;margin-top:28px;padding:0}
#about .about-strengths li{display:grid;grid-template-columns:24px minmax(0,1fr);gap:14px;padding:19px 0;border-top:1px solid var(--line)}
#about .about-strength-number{font-size:11px;color:var(--terracotta);letter-spacing:.08em;padding-top:4px}
#about .about-strengths h3{font-family:var(--font-body);font-size:16px;line-height:1.6;font-weight:600;word-break:keep-all}
#about .about-strengths p{margin-top:5px;font-size:14px;line-height:1.8;word-break:keep-all}
#about .service-more{margin-top:18px}
@media(max-width:560px){#about .about-strengths li{gap:10px;padding:17px 0}#about .about-strengths h3{font-size:15px}#about .about-strengths p{font-size:13px}}
@media(max-width:900px){#about .about-grid{grid-template-columns:minmax(0,1fr)}#about .about-photo{min-height:0;aspect-ratio:4/5;max-height:620px}#about .about-copy p{margin-top:20px;line-height:1.8;white-space:normal}#about .about-strengths p{margin-top:5px}}`}</style>
      <img src="/images/muare-mark.png" alt="" className="section-watermark-mark" aria-hidden="true" />
      <div className="wrap about-grid">
        <Reveal className="about-photo">
          <img src={about.image} alt={about.imageAlt} loading="lazy" />
        </Reveal>
        <Reveal className="about-copy" delay={80}>
          <div className="eyebrow-plain about-specialties">3D VISUALIZATION · INTERIOR · ARCHITECTURE · EXHIBITION · COMMERCIAL</div>
          <h2 className="section-title">{about.heading.replace('공간이, 눈앞에', '공간이,\n눈앞에')}</h2>
          <p>좋아하는 소재와 가구, 막연하게 그려온 분위기까지.<br />도면과 아이디어에 질감과 빛을 더해, 완성될 공간을 미리 보여드립니다.</p>
          <ol className="about-strengths">
            <li>
              <span className="about-strength-number">01</span>
              <div><h3>실제 시공까지 생각하는 디테일</h3><p>7년의 실무 경험으로 구조와 마감, 조명까지 세심하게 살핍니다.</p></div>
            </li>
            <li>
              <span className="about-strength-number">02</span>
              <div><h3>원하는 가구를 그대로, 직접 모델링</h3><p>기성 소스에 없는 제품도 사진과 치수를 바탕으로 형태와 비례를 구현합니다.</p></div>
            </li>
            <li>
              <span className="about-strength-number">03</span>
              <div><h3>필요한 만큼, 유연하게 함께</h3><p>참고 이미지 한 장에서 시작해 작업 범위를 정하고, 피드백으로 완성도를 높입니다.</p></div>
            </li>
          </ol>
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
