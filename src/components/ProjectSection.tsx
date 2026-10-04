import { useEffect, useRef } from 'react'
import type { Project } from '../data/projects'
import { onFrame, store } from '../lib/store'

/** Where the "verified / settled" state lights up in each project's narrative, and what it's called. */
const resolveAt: Record<string, { at: number; label: string }> = {
  verix: { at: 0.88, label: 'Verified credit · on-chain' },
  tapguard: { at: 0.55, label: 'Verified' },
  smartmarket: { at: 0.88, label: 'Settled' },
  swiflo: { at: 0.9, label: 'Settled' },
}

function StageTrack({ project, index }: { project: Project; index: number }) {
  const list = useRef<HTMLOListElement>(null)
  const status = useRef<HTMLParagraphElement>(null)
  const statusText = useRef<HTMLSpanElement>(null)
  const last = useRef(-2)
  const lastOn = useRef(false)

  useEffect(() => {
    const items = list.current?.children
    if (!items) return
    const n = project.stages.length
    const rule = resolveAt[project.id]
    return onFrame(() => {
      const live = store.projectIndex === index
      const p = live ? store.projectProgress : store.projectIndex > index ? 1 : 0
      const cur = Math.min(n - 1, Math.floor(p * 0.999 * n))
      const on = p >= rule.at
      if (cur !== last.current || on !== lastOn.current) {
        last.current = cur
        lastOn.current = on
        for (let i = 0; i < n; i++) {
          const li = items[i] as HTMLElement
          li.classList.toggle('is-done', i < cur)
          li.classList.toggle('is-active', i === cur)
          li.classList.toggle('is-verified', on && i >= n - 2 && i <= cur)
        }
        status.current?.classList.toggle('is-on', on)
        if (statusText.current) statusText.current.textContent = on ? rule.label : ''
      }
    })
  }, [project, index])

  const rule = resolveAt[project.id]
  return (
    <div className="project__stage-foot">
      <p className="status mono" ref={status}>
        <i aria-hidden="true" />
        <span>
          {project.visualConcept}
          <span className="muted"> — runtime view</span>
        </span>
        <span ref={statusText} aria-live="polite" />
      </p>
      <ol className="track mono" ref={list} aria-label={`${project.name} runtime stages: ${project.stages.join(', ')}`}>
        {project.stages.map((s) => (
          <li key={s}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mono muted" style={{ fontSize: '0.64rem' }}>
        Conceptual visualization · resolves to “{rule.label}”
      </p>
    </div>
  )
}

export function ProjectSection({ project, index }: { project: Project; index: number }) {
  return (
    <section id={project.id} className={`project project--${project.id}`} aria-labelledby={`${project.id}-title`}>
      <div className="project__stage">
        <div className="project__head">
          <p className="project__num mono">
            <b>{project.number}</b>
            <span>/ 04</span>
          </p>
          <h2 id={`${project.id}-title`} className="display project__name" data-split aria-label={project.name}>
            {project.name}
          </h2>
          <p className="project__desc" data-fade data-delay="200">
            {project.descriptor}
          </p>
        </div>
        <StageTrack project={project} index={index} />
      </div>

      <div className="project__detail">
        <div className="panel">
          <p className="panel__sum" data-fade>
            {project.summary}
          </p>
          <div data-fade>
            <h3 className="mono">What I built</h3>
            <ul className="bul">
              {project.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          {project.technicalDetails && (
            <div data-fade>
              <h3 className="mono">Technical details</h3>
              <ul className="chips">
                {project.technicalDetails.map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div data-fade>
            <h3 className="mono">Stack</h3>
            <ul className="chips">
              {project.stack.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {project.achievement && (
            <p className="badge mono" data-fade>
              <i aria-hidden="true" />
              {project.achievement}
            </p>
          )}
          {(project.github || project.demo) && (
            <div className="links">
              {project.github && (
                <a className="btn" href={project.github} target="_blank" rel="noopener noreferrer" data-cursor="CODE ↗">
                  Code <span className="arr">↗</span>
                  <span className="sr-only"> — {project.name} source</span>
                </a>
              )}
              {project.demo && (
                <a className="btn btn--solid" href={project.demo} target="_blank" rel="noopener noreferrer" data-cursor="OPEN ↗">
                  Live <span className="arr">↗</span>
                  <span className="sr-only"> — {project.name} demo</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
