import type { ConsultAttachment } from '../lib/consultService'

/**
 * 상담글에 첨부된 파일들을 분류별로 묶어서 보여줍니다.
 * 사진은 실제 썸네일로, 그 외 파일(PDF/DWG/동영상 등)은 파일 아이콘 + 이름으로 표시하고,
 * 전부 원본 파일명을 제목처럼 보여줘서 어떤 파일인지 바로 알 수 있게 했습니다.
 */
export default function AttachmentGallery({ items }: { items: ConsultAttachment[] }) {
  if (!items || items.length === 0) return null

  const order: string[] = []
  const groups = new Map<string, ConsultAttachment[]>()
  for (const it of items) {
    if (!groups.has(it.label)) {
      groups.set(it.label, [])
      order.push(it.label)
    }
    groups.get(it.label)!.push(it)
  }

  return (
    <div className="attachment-gallery">
      {order.map((label) => (
        <div key={label} className="attachment-group">
          <div className="attachment-group-label">{label}</div>
          <div className="attachment-grid">
            {groups.get(label)!.map((a, i) => (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-item"
                title={a.name}
              >
                {a.isImage ? (
                  <img src={a.url} alt={a.name} loading="lazy" />
                ) : (
                  <div className="attachment-file-icon">📎</div>
                )}
                <span className="attachment-name">{a.name}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
