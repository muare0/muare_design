/**
 * 어두운 CTA 배경 좌측에 은은하게 깔리는 라인아트 꽃/줄기 문양입니다.
 * 로고 워터마크(우측)와 짝을 이루도록 얇은 선 위주로 그리되,
 * 메인 줄기 + 보조 줄기, 잎, 크고 작은 꽃송이를 더해 한층 풍성하게 구성했습니다.
 */
export default function FloralMark() {
  const blossoms = [
    { x: 158, y: 322, s: 1.05 },
    { x: 60, y: 470, s: 0.6 },
    { x: 196, y: 150, s: 0.9 },
    { x: 118, y: 4, s: 0.7 },
    { x: 240, y: 520, s: 0.5 },
    { x: 44, y: 236, s: 0.42 },
  ]
  const leaves: Array<[number, number, number, number]> = [
    [32, 478, -35, 17],
    [58, 298, 35, 16],
    [82, 148, -30, 14],
    [128, 402, 20, 12],
    [150, 212, -18, 12],
    [176, 78, 24, 11],
    [204, 480, -26, 10],
  ]

  return (
    <svg className="cta-floral" viewBox="0 0 320 640" fill="none" aria-hidden="true">
      {/* 메인 줄기 */}
      <path
        d="M24 620 C 52 542 8 468 46 398 C 78 338 32 278 70 218 C 96 176 58 128 92 80 C 112 50 98 26 118 4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* 메인 줄기에서 뻗는 가지 */}
      <path d="M46 398 C 92 380 110 340 152 328" stroke="currentColor" strokeWidth="1.2" />
      <path d="M70 218 C 114 208 132 174 170 158" stroke="currentColor" strokeWidth="1.2" />
      <path d="M92 80 C 130 70 142 38 178 26" stroke="currentColor" strokeWidth="1.2" />
      <path d="M46 398 C 30 432 46 460 34 498" stroke="currentColor" strokeWidth="1" />
      <path d="M70 218 C 44 244 46 270 34 296" stroke="currentColor" strokeWidth="1" />

      {/* 보조 줄기 — 메인보다 가늘고 짧게, 오른쪽으로 살짝 휘어 풍성함을 더함 */}
      <path
        d="M96 560 C 118 500 90 446 122 392 C 146 350 118 300 148 254"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.75"
      />
      <path d="M122 392 C 158 384 170 356 202 346" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      <path d="M148 254 C 180 246 190 218 220 206" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />

      {/* 잎 */}
      {leaves.map(([cx, cy, rot, rx], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={rx * 0.38}
          transform={`rotate(${rot} ${cx} ${cy})`}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.85}
        />
      ))}

      {/* 꽃송이 — 크고 작은 송이를 흩뿌려 화사하게 */}
      {blossoms.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
          <circle r="4" fill="currentColor" />
          <circle cx="10" cy="0" r="7" stroke="currentColor" strokeWidth="1" />
          <circle cx="-8" cy="6" r="7" stroke="currentColor" strokeWidth="1" />
          <circle cx="-3" cy="-9" r="7" stroke="currentColor" strokeWidth="1" />
          <circle cx="7" cy="-8" r="7" stroke="currentColor" strokeWidth="1" />
          <circle cx="-9" cy="-3" r="7" stroke="currentColor" strokeWidth="1" />
        </g>
      ))}

      {/* 작은 점 장식 — 흩날리는 꽃가루 느낌 */}
      {[
        [220, 90],
        [246, 430],
        [16, 560],
        [270, 260],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="currentColor" opacity="0.6" />
      ))}
    </svg>
  )
}
