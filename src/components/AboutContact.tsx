import { useRef, useState } from 'react'
import { animate } from 'animejs'
import { education, site } from '../data/site'

export function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="display about__title" data-split>
        Behind every interface <em>is a system.</em>
      </h2>
      <div className="about__grid">
        <p data-fade>
          I’m a backend and blockchain developer based in {site.location}. I work on the parts of an application users
          never see: on-chain programs, payment flows, services and the data layer underneath.
        </p>
        <p data-fade data-delay="100">
          My projects span Solana, Hedera and AI-agent systems — from an NFC tap-to-pay vault to a cross-border
          remittance backend — and have been recognised at Cypherpunk (Superteam) and ETHOnline 2025 (ETHGlobal).
        </p>
        <div className="edu" data-fade data-delay="200">
          <span className="mono">Education</span>
          <b>{education.degree}</b>
          <span>
            {education.school} · expected {education.year}
          </span>
        </div>
      </div>
    </section>
  )
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  const label = useRef<HTMLSpanElement>(null)
  const timer = useRef<number>(0)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    if (label.current) animate(label.current, { opacity: [0, 1], translateY: [6, 0], duration: 500, ease: 'outExpo' })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 2200)
  }
  return (
    <button className={`copy mono${done ? ' is-done' : ''}`} onClick={copy} data-cursor="COPY" aria-label={done ? 'Email copied' : 'Copy email address'}>
      <span ref={label} aria-live="polite">
        {done ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}

export function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div>
        <h2 id="contact-title" className="display contact__title" aria-label="Let’s build what’s next.">
          <span data-split>Let’s build</span>
          <span data-split data-delay="140">
            what’s next.
          </span>
        </h2>
        <div className="contact__body">
          <div className="crow">
            <span className="mono muted">Email</span>
            <a className="crow__v ulink" href={`mailto:${site.email}`} data-cursor="OPEN ↗">
              {site.email}
            </a>
            <CopyButton value={site.email} />
          </div>
          <div className="crow">
            <span className="mono muted">LinkedIn</span>
            <a className="crow__v ulink" href={site.linkedin} target="_blank" rel="noopener noreferrer" data-cursor="OPEN ↗">
              rishav-bhusal
            </a>
            <span className="mono muted">↗</span>
          </div>
          {site.github && (
            <div className="crow">
              <span className="mono muted">GitHub</span>
              <a className="crow__v ulink" href={site.github} target="_blank" rel="noopener noreferrer" data-cursor="CODE ↗">
                {site.github.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
              <span className="mono muted">↗</span>
            </div>
          )}
        </div>
      </div>
      <div className="final">
        <span className="final__dot" aria-hidden="true" />
        <p className="mono">System ready.</p>
      </div>
      <p className="footer mono">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>{site.role}</span>
      </p>
    </section>
  )
}
