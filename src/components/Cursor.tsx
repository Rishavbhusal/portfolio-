import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '../hooks/useEnv'

/** Restrained cursor: a point that grows a contextual label over [data-cursor] targets. Fine pointers only. */
export function Cursor() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const enabled = fine && !reduced

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    let x = -100
    let y = -100
    let cx = x
    let cy = y
    let raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
    }
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor]')
      const el = root.current
      if (!el) return
      if (t) {
        if (label.current) label.current.textContent = t.dataset.cursor ?? ''
        el.classList.add('is-label')
      } else el.classList.remove('is-label')
    }
    const tick = () => {
      cx += (x - cx) * 0.28
      cy += (y - cy) * 0.28
      if (root.current) root.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <span className="cursor__dot" />
      <span className="cursor__label" ref={label} />
    </div>
  )
}
