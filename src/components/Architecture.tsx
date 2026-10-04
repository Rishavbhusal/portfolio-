import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useReducedMotion } from '../hooks/useEnv'

interface Node {
  id: string
  label: string
  x: number
  y: number
  title: string
  body: string
  tags: string[]
}

const W = 130
const H = 56

const nodes: Node[] = [
  {
    id: 'client',
    label: 'Client',
    x: 10,
    y: 152,
    title: 'Client',
    body: 'Web frontends and wallet-connected apps. Wallet integration (MetaMask, Phantom) and Web3.js / Ethers.js live at this edge.',
    tags: ['Wallet integration', 'Web3.js / Ethers.js'],
  },
  {
    id: 'api',
    label: 'API',
    x: 165,
    y: 152,
    title: 'API',
    body: 'RESTful APIs behind Authentication / JWT. Idempotency keys make retried requests safe to accept twice.',
    tags: ['REST', 'Auth / JWT', 'Idempotency'],
  },
  {
    id: 'service',
    label: 'Service',
    x: 320,
    y: 152,
    title: 'Service',
    body: 'Microservices speaking gRPC, written in Node.js and TypeScript. Business logic stays here, not in the edge.',
    tags: ['gRPC', 'Microservices', 'Node.js · TypeScript'],
  },
  {
    id: 'cache',
    label: 'Cache · Redis',
    x: 475,
    y: 60,
    title: 'Cache',
    body: 'Redis as a fast layer in front of the database for hot reads.',
    tags: ['Redis'],
  },
  {
    id: 'db',
    label: 'Database · SQL',
    x: 475,
    y: 152,
    title: 'Database',
    body: 'PostgreSQL with deliberate schema design and SQL optimization — the durable source of truth.',
    tags: ['PostgreSQL', 'SQL optimization', 'Database design'],
  },
  {
    id: 'events',
    label: 'Events · Queue',
    x: 475,
    y: 244,
    title: 'Events',
    body: 'Event-driven design and message queues decouple the request path from everything that can happen later.',
    tags: ['Event-driven systems', 'Message queues'],
  },
  {
    id: 'async',
    label: 'Async work',
    x: 630,
    y: 244,
    title: 'Async processing',
    body: 'Consumers process events off the request path. Idempotent handlers mean retries never double-apply.',
    tags: ['Idempotency', 'Testing', 'Scalable design'],
  },
]

// polyline routes (viewBox coords) for the two travelling packets
const routeA = 'M75 180 H540'
const routeB = 'M385 180 V272 H695'

function Packet({ d, color, run, delay }: { d: string; color: boolean; run: boolean; delay: number }) {
  const path = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  useEffect(() => {
    const p = path.current
    const c = dot.current
    if (!p || !c) return
    const len = p.getTotalLength()
    const place = (u: number) => {
      const pt = p.getPointAtLength(len * u)
      c.setAttribute('cx', String(pt.x))
      c.setAttribute('cy', String(pt.y))
    }
    if (!run) {
      place(0.5)
      c.style.opacity = '0.0'
      return
    }
    const state = { u: 0 }
    const a = animate(state, {
      u: [0, 1],
      duration: 3600,
      delay,
      ease: 'inOutSine',
      loop: true,
      loopDelay: 700,
      onUpdate: () => {
        place(state.u)
        c.style.opacity = String(Math.min(1, state.u * 12, (1 - state.u) * 12))
      },
    })
    return () => {
      a.pause()
    }
  }, [d, run, delay])
  return (
    <>
      <path ref={path} d={d} fill="none" stroke="none" />
      <circle ref={dot} r="4" className={`dpacket${color ? ' is-ok' : ''}`} cx="0" cy="0" />
    </>
  )
}

export function Architecture() {
  const [sel, setSel] = useState('api')
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const node = nodes.find((n) => n.id === sel) ?? nodes[1]

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const run = inView && !reduced

  return (
    <section id="architecture" className="arch" aria-labelledby="arch-title">
      <h2 id="arch-title" className="display sec-title" aria-label="Behind the interface">
        <span data-split>Behind</span>
        <span data-split data-delay="140">
          The interface.
        </span>
      </h2>
      <div className="arch__layout">
        <div ref={box}>
          <svg className="diagram" viewBox="0 0 770 330" role="group" aria-label="Backend architecture capability diagram: client, API, service, then cache, database and events, then asynchronous processing">
            <g aria-hidden="true">
              <path className="dlink" d="M140 180 H165" />
              <path className="dlink" d="M295 180 H320" />
              <path className="dlink" d="M450 168 H462 V88 H475" />
              <path className="dlink" d="M450 180 H475" />
              <path className="dlink" d="M450 192 H462 V272 H475" />
              <path className="dlink" d="M605 272 H630" />
            </g>
            {nodes.map((n) => (
              <g
                key={n.id}
                className={`dnode${sel === n.id ? ' is-sel' : ''}`}
                transform={`translate(${n.x} ${n.y})`}
                tabIndex={0}
                role="button"
                aria-pressed={sel === n.id}
                aria-label={n.title}
                data-cursor="EXPLORE"
                onMouseEnter={() => setSel(n.id)}
                onFocus={() => setSel(n.id)}
                onClick={() => setSel(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSel(n.id)
                  }
                }}
              >
                <rect width={W} height={H} rx="2" />
                <text x={W / 2} y={H / 2 + 4} textAnchor="middle">
                  {n.label}
                </text>
              </g>
            ))}
            <Packet d={routeA} color={false} run={run} delay={0} />
            <Packet d={routeB} color run={run} delay={1500} />
          </svg>
          <p className="arch__note mono">A capability diagram — not a description of any single project.</p>
        </div>
        <div className="readout" aria-live="polite">
          <p className="mono muted">Layer</p>
          <h3 className="readout__title">{node.title}</h3>
          <p>{node.body}</p>
          <ul className="chips readout__tags">
            {node.tags.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
