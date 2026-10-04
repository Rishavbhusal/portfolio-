import { achievements } from '../data/achievements'
import { projects } from '../data/projects'

export function Intro() {
  return (
    <section id="intro" className="intro" aria-labelledby="intro-title">
      <h2 id="intro-title" className="display intro__statement" data-split>
        I build the infrastructure <em>behind digital value.</em>
      </h2>
      <div className="intro__grid">
        <p className="intro__lead" data-fade>
          Backend and blockchain developer working across event-driven backends, Solana and EVM tooling — from the services and
          databases to the on-chain programs that connect to them.
        </p>
        <ol className="index-list" data-fade data-delay="120">
          <li>
            <span className="mono muted">01</span>
            <b>Backend</b>
            <p>Node.js and TypeScript services, PostgreSQL, Redis, REST and gRPC.</p>
          </li>
          <li>
            <span className="mono muted">02</span>
            <b>Blockchain</b>
            <p>Solana programs in Anchor/Rust, Solidity contracts, wallet integration.</p>
          </li>
          <li>
            <span className="mono muted">03</span>
            <b>Distributed systems</b>
            <p>Microservices, event-driven design, message queues and idempotency.</p>
          </li>
          <li>
            <span className="mono muted">04</span>
            <b>DeFi</b>
            <p>Liquidity pool integration, fee mechanisms, on-chain voting, x402 payments.</p>
          </li>
        </ol>
      </div>
    </section>
  )
}

export function Achievements() {
  return (
    <section id="achievements" className="ach" aria-labelledby="ach-title">
      <p className="label mono" id="ach-title">
        Verified record
      </p>
      <ol className="ach__list">
        {achievements.map((a, i) => {
          const project = projects.find((p) => p.id === a.projectId)
          return (
            <li key={a.id} className="record" data-fade data-delay={i * 140}>
              <p className="record__tag mono">
                <i aria-hidden="true" />
                {`0${i + 1} / Verified`}
              </p>
              <h3 className="display record__org">{a.org}</h3>
              <p className="display record__result">
                {a.result}
                {a.id === 'cypherpunk' ? ' — ' + a.detail : ''}
              </p>
              <p className="record__meta mono">
                <span>
                  Project <b>{project?.name}</b>
                </span>
                <span>
                  Issued by <b>{a.issuer}</b>
                </span>
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function WorkDivider() {
  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <h2 id="work-title" className="display work__title" aria-label="Selected work">
        <span data-split>Selected</span>
        <span data-split data-delay="160">
          Work
        </span>
      </h2>
      <p className="work__note mono" data-fade>
        <span>04 projects</span>
        <span>Solana · Hedera · AI agents · Payments</span>
      </p>
    </section>
  )
}
