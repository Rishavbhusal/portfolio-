import { site } from '../data/site'
import { scrollToId } from '../animation/stringtune'

export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <span className="scrollcue mono" aria-hidden="true">
        Scroll
      </span>
      <h1 id="hero-title" className="display hero__name" aria-label={site.name}>
        <span data-split>Rishav</span>
        <span data-split data-delay="140">
          Bhusal
        </span>
      </h1>
      <div className="hero__lower">
        <div>
          <p className="hero__role" data-fade data-delay="300">
            {site.role}
          </p>
          <p className="hero__tags mono" data-fade data-delay="380">
            {site.tagline}
          </p>
          <p className="hero__copy" data-fade data-delay="460">
            I build scalable Node.js backend systems, decentralized infrastructure and programmable payments.
          </p>
          <div className="hero__cta" data-fade data-delay="540">
            <a
              href="#work"
              className="btn btn--solid"
              string="magnetic"
              string-strength="0.12"
              string-radius="120"
              data-cursor="EXPLORE"
              onClick={(e) => {
                e.preventDefault()
                scrollToId('work')
              }}
            >
              View projects <span className="arr">↗</span>
            </a>
            {site.github && (
              <a className="btn" href={site.github} target="_blank" rel="noopener noreferrer" data-cursor="CODE ↗" string="magnetic" string-strength="0.12" string-radius="100">
                GitHub <span className="arr">↗</span>
              </a>
            )}
            <a className="btn" href={site.linkedin} target="_blank" rel="noopener noreferrer" data-cursor="OPEN ↗" string="magnetic" string-strength="0.12" string-radius="100">
              LinkedIn <span className="arr">↗</span>
            </a>
          </div>
        </div>
        <ul className="boot mono" aria-label="System status">
          <li data-fade data-delay="200">
            <span>Initializing</span>
            <span>…</span>
          </li>
          <li data-fade data-delay="650">
            <span>Network ....</span>
            <span className="on">Online</span>
          </li>
          <li data-fade data-delay="1100">
            <span>System .....</span>
            <span className="on">Ready</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
