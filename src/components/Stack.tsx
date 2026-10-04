import { skillGroups, tools } from '../data/skills'
import { projects } from '../data/projects'

const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? id

export function Stack() {
  return (
    <section id="stack" className="stack" aria-labelledby="stack-title">
      <h2 id="stack-title" className="display sec-title" aria-label="Engineering stack">
        <span data-split>Engineering</span>
        <span data-split data-delay="140">
          Stack
        </span>
      </h2>
      <div className="stack__grid">
        {skillGroups.map((g, gi) => (
          <div key={g.id} className="sgroup" data-fade data-delay={gi * 90}>
            <p className="sgroup__head mono">
              <span>{`0${gi + 1}`}</span>
              <span>{g.items.length}</span>
            </p>
            <h3>{g.title}</h3>
            <ul>
              {g.items.map((s) => (
                <li
                  key={s.name}
                  className={`skill${s.usedIn ? ' skill--link' : ''}`}
                  tabIndex={s.usedIn ? 0 : undefined}
                  aria-label={s.usedIn ? `${s.name}, used in ${s.usedIn.map(nameOf).join(', ')}` : undefined}
                >
                  {s.name}
                  {s.usedIn && (
                    <span className="skill__used mono" aria-hidden="true">
                      Used in {s.usedIn.map(nameOf).join(' · ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="legend mono" data-fade>
        <i aria-hidden="true" /> Hover or focus to see where it shipped
      </p>
      <p className="tools mono" data-fade>
        <span>Tools</span>
        {tools.map((t) => (
          <span key={t} className="muted">
            {t}
          </span>
        ))}
      </p>
    </section>
  )
}
