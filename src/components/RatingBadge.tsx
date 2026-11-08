/**
 * 고객 만족도 배지 — 금색 월계수 + 링 + 별점.
 * 상세페이지 이미지와 같은 형태를 SVG 로 직접 그렸습니다.
 * (이미지 파일이 아니라 벡터라 어떤 화면에서도 선명하게 보입니다)
 */
const CX = 120
const CY = 108
const RING_R = 62

/** 중심에서 반지름 r, 각도 deg 만큼 떨어진 점 (deg: 0=오른쪽, 90=아래) */
function pt(r: number, deg: number) {
  const t = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(t), y: CY + r * Math.sin(t) }
}

/** 원호 path (시계 방향) */
function arc(r: number, from: number, to: number) {
  const a = pt(r, from)
  const b = pt(r, to)
  const large = Math.abs(to - from) > 180 ? 1 : 0
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

/** 5각 별 좌표 */
function star(cx: number, cy: number, R: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? R : R * 0.45
    const ang = ((-90 + i * 36) * Math.PI) / 180
    pts.push(`${(cx + rr * Math.cos(ang)).toFixed(2)},${(cy + rr * Math.sin(ang)).toFixed(2)}`)
  }
  return pts.join(' ')
}

/** 월계수 한 가지 (왼쪽) — 오른쪽은 좌우 반전해서 씁니다 */
function LaurelBranch() {
  return <g opacity=".88">
    <path d={arc(84, 118, 192)} fill="none" stroke="url(#rbGold)" strokeWidth=".7" strokeLinecap="round" />
    {[124,135,146,157,168,179,190].map((a,i)=>{
      const p=pt(84,a)
      const size=.8-i*.035
      return <g key={a} transform={`translate(${p.x} ${p.y}) rotate(${a+47}) scale(${size})`}>
        <path d="M 0 0 C -5 -1 -13 -5 -16 -11 C -8 -12 -1 -7 0 0 Z" fill="url(#rbGold)" />
        <path d="M -1 -1 L -13 -9" fill="none" stroke="#f0dfbc" strokeWidth=".4" opacity=".65" />
        <path d="M 0 0 C 4 0 10 3 12 8 C 6 9 1 6 0 0 Z" fill="url(#rbGold)" opacity=".65" />
      </g>
    })}
  </g>
}

export default function RatingBadge({
  score = '5.0',
  label = '고객 만족도',
}: {
  score?: string
  label?: string
}) {
  return (
    <div className="rating-badge">
      <svg viewBox="0 34 240 172" role="img" aria-label={`${label} ${score}점`}>
        <defs>
          <linearGradient id="rbGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E9DCC2" />
            <stop offset="42%" stopColor="#BFA77B" />
            <stop offset="100%" stopColor="#7F6B48" />
          </linearGradient>
          <radialGradient id="rbBg" cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#4A3D33" />
            <stop offset="62%" stopColor="#241C17" />
            <stop offset="100%" stopColor="#140F0C" />
          </radialGradient>
          <filter id="rbBlur" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* 월계수 */}
        <LaurelBranch />
        <g transform={`translate(${CX * 2} 0) scale(-1 1)`}>
          <LaurelBranch />
        </g>

        {/* 안쪽 어두운 면 */}
        <circle cx={CX} cy={CY} r={RING_R} fill="url(#rbBg)" />

        {/* 링 — 번지는 빛 + 선명한 선 + 위쪽 하이라이트 */}
        <circle
          cx={CX}
          cy={CY}
          r={RING_R}
          fill="none"
          stroke="url(#rbGold)"
          strokeWidth="3"
          opacity=".15"
          filter="url(#rbBlur)"
        />
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="url(#rbGold)" strokeWidth=".8" />
        <path
          d={arc(RING_R, 198, 342)}
          fill="none"
          stroke="#F8E9C4"
          strokeWidth=".7"
          strokeLinecap="round"
          opacity=".85"
        />

        {/* 별점 */}
        <g fill="url(#rbGold)">
          {[0, 1, 2, 3, 4].map((i) => (
            <polygon key={i} points={star(CX + (i - 2) * 15, 75, 4.4)} />
          ))}
        </g>

        {/* 점수 + 라벨 */}
        <text className="rb-score" x={CX} y="133" textAnchor="middle">
          {score}
        </text>
        <text className="rb-label" x={CX} y="157" textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  )
}
