import { FORMATIONS, clamp, emitFrame, lerp, sectionKeys, smoothstep, store } from './store'
import { projects } from '../data/projects'
import { getScrollY } from '../animation/stringtune'

interface Anchor {
  el: HTMLElement
  top: number
  height: number
  center: number
}

let anchors: (Anchor | null)[] = []

const measure = () => {
  store.vh = window.innerHeight
  store.vw = window.innerWidth
  store.mobile = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
  const sy = getScrollY()
  anchors = sectionKeys.map((k) => {
    const el = document.getElementById(k.id)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const top = r.top + sy
    return { el, top, height: r.height, center: top + r.height / 2 - store.vh / 2 }
  })
}

export interface DriverOut {
  /** Per-key world state, consumed by the WebGL layer. */
  keyIndexA: number
  keyIndexB: number
}

export const driver: DriverOut = { keyIndexA: 0, keyIndexB: 0 }

let raf = 0
let last = performance.now()
let activeId = 'hero'
let onActive: ((id: string) => void) | null = null

export function setActiveListener(fn: (id: string) => void) {
  onActive = fn
}

const tick = (now: number) => {
  raf = requestAnimationFrame(tick)
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now

  // StringTune already smooths scroll on desktop; the extra damping keeps the world weighted.
  const target = getScrollY()
  const k = store.reduced ? 1 : 1 - Math.pow(0.0006, dt)
  const prev = store.scrollY
  store.scrollY = lerp(store.scrollY, target, k)
  store.scrollVelocity = lerp(store.scrollVelocity, (store.scrollY - prev) / Math.max(dt, 1e-3), 0.1)

  const y = store.scrollY
  // Locate segment between consecutive section anchors (anchor = section centred in viewport).
  let ia = 0
  for (let i = 0; i < anchors.length; i++) {
    const an = anchors[i]
    if (an && y >= an.center - 1) ia = i
  }
  let ib = ia
  for (let i = ia + 1; i < anchors.length; i++) {
    if (anchors[i]) {
      ib = i
      break
    }
  }
  const A = anchors[ia]
  const B = anchors[ib]
  let t = 0
  if (A && B && ib !== ia) {
    const startHold = Math.max(A.center, A.top + A.height - store.vh * 0.6)
    const endHold = Math.min(B.center, B.top - store.vh * 0.05)
    // hero is short: begin immediately.
    const from = ia === 0 ? 0 : startHold
    const to = Math.max(from + 1, endHold)
    t = smoothstep(0, 1, clamp((y - from) / (to - from)))
  }
  driver.keyIndexA = ia
  driver.keyIndexB = ib
  store.a = FORMATIONS.indexOf(sectionKeys[ia].formation)
  store.b = FORMATIONS.indexOf(sectionKeys[ib].formation)
  store.t = t

  // Project progress.
  let pi = -1
  let pp = 0
  for (let i = 0; i < projects.length; i++) {
    const idx = sectionKeys.findIndex((s) => s.id === projects[i].id)
    const an = anchors[idx]
    if (!an) continue
    const start = an.top - store.vh * 0.55
    const end = an.top + an.height - store.vh * 0.45
    if (y >= start - store.vh * 0.5 && y <= end + store.vh * 0.5) {
      pi = i
      pp = clamp((y - start) / Math.max(1, end - start))
    }
  }
  store.projectIndex = pi
  store.projectProgress = pp

  // Contact shutdown 100 -> 30 -> 10 -> 3 -> 1.
  const cIdx = sectionKeys.findIndex((s) => s.id === 'contact')
  const cn = anchors[cIdx]
  if (cn) {
    const start = cn.top - store.vh * 0.9
    const end = cn.top + Math.max(0, cn.height - store.vh) * 0.9 + store.vh * 0.2
    store.shutdown = clamp((y - start) / Math.max(1, end - start))
  }

  // Active section (for navigation).
  const probe = y + store.vh * 0.4
  let id = 'hero'
  for (let i = 0; i < anchors.length; i++) {
    const an = anchors[i]
    if (an && probe >= an.top) id = sectionKeys[i].id
  }
  if (id !== activeId) {
    activeId = id
    store.activeSection = id
    onActive?.(id)
  }

  emitFrame()
}

export function startDriver() {
  measure()
  store.scrollY = getScrollY()
  const onResize = () => measure()
  window.addEventListener('resize', onResize)
  const ro = new ResizeObserver(() => measure())
  ro.observe(document.body)
  document.fonts?.ready.then(measure).catch(() => {})
  window.addEventListener('load', measure)
  const onVis = () => {
    store.hidden = document.hidden
    last = performance.now()
  }
  document.addEventListener('visibilitychange', onVis)
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('load', measure)
    document.removeEventListener('visibilitychange', onVis)
    ro.disconnect()
  }
}

export const remeasure = measure
