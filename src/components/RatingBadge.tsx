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
  const leaves = [
    [37,128,-42,12], [40,137,-51,5], [46,145,-60,-5],
    [53,153,-68,-13], [62,160,-76,-23], [72,166,-84,-32],
  ]
  return <g>
    <path d="M 22 113 C 26 139 47 159 78 170" fill="none" stroke="url(#rbGold)" strokeWidth=".85" strokeLinecap="round" />
    <path d="M 36 119 C 36 141 49 157 77 169" fill="none" stroke="url(#rbGold)" strokeWidth=".65" />
    <path d="M 36 121 C 32 117 33 111 36 107 C 39 112 39 117 36 121 Z" fill="url(#rbGold)" />
    {leaves.map(([x,y,outer,inner],i)=><g key={i}>
      <path d="M 0 0 C -3 -2 -4 -8 0 -12 C 4 -8 3 -2 0 0 Z" transform={`translate(${x} ${y}) rotate(${outer})`} fill="url(#rbGold)" />
      <path d="M 0 0 C -2 -3 -3 -8 0 -12 C 3 -8 3 -3 0 0 Z" transform={`translate(${x+1} ${y-1}) rotate(${inner})`} fill="url(#rbGold)" />
    </g>)}
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
            <stop offset="0%" stopColor="#FFE8AB" />
            <stop offset="23%" stopColor="#A16A19" /><stop offset="45%" stopColor="#FFE59A" /><stop offset="58%" stopColor="#C69232" /><stop offset="80%" stopColor="#FFF0B9" />
            <stop offset="100%" stopColor="#91652B" />
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
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="url(#rbGold)" strokeWidth="1.4" />
        <path
          d={arc(RING_R, 198, 342)}
          fill="none"
          stroke="#F8E9C4"
          strokeWidth=".7"
          strokeLinecap="round"
          opacity=".85"
        />

        <circle cx={CX} cy={CY} r="65" fill="none" className="rb-soft-halo" stroke="#ffd773" strokeWidth="2.5" opacity=".4" filter="url(#rbBlur)" /><circle cx={CX} cy={CY} r="65" fill="none" stroke="url(#rbGold)" strokeWidth="3" />
        <circle cx={CX} cy={CY} r="59" fill="none" stroke="#e8c36a" strokeWidth=".65" strokeDasharray=".6 2.3" />
        
        <ellipse className="rb-ground-glow" cx="120" cy="180" rx="58" ry="2" fill="#e8bb52" filter="url(#rbBlur)" opacity=".6" />
        {[ [30,130],[43,151],[62,165],[210,130],[197,151],[178,165] ].map(([x,y],i)=><g key={i} className="rb-leaf-glint" style={{animationDelay:(i*.6)+'s'}}><circle cx={x} cy={y} r="2" fill="#ffe9a1" filter="url(#rbBlur)" /><path d={`M ${x-2.4} ${y} h4.8 M ${x} ${y-2.4} v4.8`} stroke="#fff2bc" strokeWidth=".55" /></g>)}
        <g className="rb-moving-light" style={{transformOrigin:'120px 108px',animationDuration:'9s'}}>
          <circle cx={CX} cy={CY} r="65" fill="none" stroke="#D4A653" strokeWidth="3" strokeDasharray="20 388" strokeLinecap="round" opacity=".6" filter="url(#rbBlur)" />
          <ellipse cx="185" cy="108" rx="3.5" ry="6" fill="#FFE8AB" opacity=".7" filter="url(#rbBlur)" />
          <circle cx="185" cy="108" r="1.8" fill="#FFE8AB" opacity=".65" filter="url(#rbBlur)" />
        </g>
        {/* 별점 */}
        <g fill="url(#rbGold)">
          {[0, 1, 2, 3, 4].map((i) => (
            <polygon key={i} points={star(CX + (i - 2) * 17, 74, 7)} />
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
