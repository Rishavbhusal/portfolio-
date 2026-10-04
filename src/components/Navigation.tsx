import { useEffect, useRef, useState } from 'react'
import { scrollToId } from '../animation/stringtune'
import { onFrame, store } from '../lib/store'
import { setActiveListener } from '../lib/scrollDriver'

const links = [
  { id: 'work', label: 'Work', group: ['work', 'verix', 'tapguard', 'smartmarket', 'swiflo'] },
  { id: 'stack', label: 'Expertise', group: ['stack', 'architecture'] },
  { id: 'about', label: 'About', group: ['about'] },
  { id: 'contact', label: 'Contact', group: ['contact'] },
]

export function Navigation({ onOpenIndex }: { onOpenIndex: () => void }) {
  const [active, setActive] = useState('hero')
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveListener(setActive)
    return onFrame(() => {
      const max = document.documentElement.scrollHeight - store.vh
      bar.current?.style.setProperty('--scroll', String(max > 0 ? Math.min(1, store.scrollY / max) : 0))
    })
  }, [])

  return (
    <>
      <div className="nav__progress" ref={bar} aria-hidden="true" />
      <header className="nav">
        <a
          href="#hero"
          className="nav__brand"
          aria-label="Rishav Bhusal — back to top"
          data-cursor="TOP"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('hero')
          }}
        >
          RB<i>.</i>
        </a>
        <nav className="nav__links mono" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="nav__link"
              aria-current={l.group.includes(active) ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault()
                scrollToId(l.id)
              }}
            >
              {l.label}
            </a>
          ))}
          <button className="nav__index mono" onClick={onOpenIndex} aria-haspopup="dialog" data-cursor="OPEN">
            Index
          </button>
        </nav>
      </header>
    </>
  )
}
