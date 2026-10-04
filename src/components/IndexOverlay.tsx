import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'
import { scrollToId } from '../animation/stringtune'

const sections = [
  ['hero', 'Intro'],
  ['work', 'Selected Work'],
  ['stack', 'Engineering Stack'],
  ['architecture', 'Behind the Interface'],
  ['about', 'About'],
  ['contact', 'Contact'],
]

export function IndexOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && root.current) {
        const f = root.current.querySelectorAll<HTMLElement>('a[href], button')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    onClose()
    setTimeout(() => scrollToId(id), 250)
  }

  return (
    <div
      ref={root}
      className={`overlay${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site and project index"
      aria-hidden={!open}
    >
      <button ref={closeBtn} className="overlay__close mono" onClick={onClose} tabIndex={open ? 0 : -1}>
        Close ✕
      </button>
      <div>
        <h2 className="mono">Navigate</h2>
        <nav className="overlay__nav" aria-label="Sections">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={go(id)} tabIndex={open ? 0 : -1}>
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div>
        <h2 className="mono">Projects</h2>
        <ol>
          {projects.map((p) => (
            <li key={p.id} className="pi">
              <span className="mono muted">{p.number}</span>
              <div>
                <a href={`#${p.id}`} onClick={go(p.id)} tabIndex={open ? 0 : -1} className="pi__name">
                  {p.name}
                </a>
                <p className="pi__meta">
                  {p.descriptor} — {p.stack.join(' · ')}
                </p>
                {p.achievement && <p className="pi__acc mono">{p.achievement}</p>}
              </div>
              <div className="pi__links mono">
                <a href={`#${p.id}`} className="ulink" onClick={go(p.id)} tabIndex={open ? 0 : -1}>
                  View
                </a>
                {p.github && (
                  <a href={p.github} className="ulink" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                    Code ↗
                  </a>
                )}
                {p.demo && (
                  <a href={p.demo} className="ulink" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                    Live ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
