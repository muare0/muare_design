import { useEffect, useRef, type ReactNode, type ElementType } from 'react'

/**
 * 스크롤 시 절제된 페이드업으로 등장시키는 래퍼입니다.
 * prefers-reduced-motion 이 켜져 있으면 CSS 에서 자동으로 비활성화됩니다.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  ...rest
}: {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
  [key: string]: unknown
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).style.transitionDelay = `${delay}ms`
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
