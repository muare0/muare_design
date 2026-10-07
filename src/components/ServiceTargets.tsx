import Reveal from './Reveal'
import { GuideIcon } from './SvcIcons'
import { TARGETS } from '../content/serviceGuide'

/**
 * "서비스 대상" 섹션 — 홈 화면(About 요약 아래)에서 사용합니다.
 * 문구는 src/content/serviceGuide.ts 의 TARGETS 한 곳에서만 관리합니다.
 */
export default function ServiceTargets() {
  const { head, items, extra } = TARGETS

  return (
    <>
      <Reveal className="guide-head">
        <div className="guide-en">{head.en}</div>
        <h2 className="guide-title">“{head.title}”</h2>
        <p className="guide-lead">{head.lead}</p>
      </Reveal>

      <div className="target-grid">
        {items.map((t, i) => (
          <Reveal className="target-card" key={t.num} delay={i * 60}>
            <span className="target-badge">{t.num}</span>
            <span className="target-icon">
              <GuideIcon name={t.icon} />
            </span>
            <div className="target-body">
              <h3 className="target-title">{t.title}</h3>
              <p className="target-desc">{t.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="guide-card target-extra" delay={120}>
        <div className="guide-card-head">
          <span className="guide-card-bar" aria-hidden="true" />
          <h3>{extra.title}</h3>
          <span className="guide-card-no">{extra.num}</span>
        </div>
        <div className="guide-card-body">
          <ul className="guide-check cols">
            {extra.items.map((x) => (
              <li key={x}>
                <span className="guide-check-mark">
                  <GuideIcon name="check" />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="guide-note">
            <span className="guide-note-icon">
              <GuideIcon name="warn" />
            </span>
            {extra.note}
          </div>
        </div>
      </Reveal>
    </>
  )
}
