/**
 * Mutable frame-rate state shared between the DOM layer and the WebGL world.
 * Nothing here is React state: high-frequency values are written by the scroll
 * driver and read inside useFrame / DOM listeners, so React never re-renders per frame.
 */

export const FORMATIONS = ['core', 'open', 'verix', 'tapguard', 'smartmarket', 'swiflo', 'engine', 'quiet', 'final'] as const
export type Formation = (typeof FORMATIONS)[number]

export interface SectionKey {
  id: string
  formation: Formation
  /** Scene weight 0..1: how calm/quiet the world should be behind this section. */
  calm: number
  /** Horizontal shift of the world on desktop (keeps the scene beside the text). */
  shift: number
  /** Camera position + look-at target. */
  cam: [number, number, number]
  look: [number, number, number]
}

export const sectionKeys: SectionKey[] = [
  { id: 'hero', formation: 'core', calm: 0.15, shift: 2.4, cam: [0, 0.4, 13], look: [0, 0, 0] },
  { id: 'intro', formation: 'open', calm: 0.35, shift: 2.6, cam: [0, 0.2, 7.5], look: [0, 0, 0] },
  { id: 'achievements', formation: 'open', calm: 0.6, shift: 3.2, cam: [0.6, 0.6, 9], look: [0, 0, 0] },
  { id: 'work', formation: 'open', calm: 0.4, shift: 0, cam: [0, 0, 4.2], look: [0, 0, 0] },
  { id: 'verix', formation: 'verix', calm: 0.1, shift: -2.2, cam: [-1.5, 1.2, 14.5], look: [0, 0, 0] },
  { id: 'tapguard', formation: 'tapguard', calm: 0.1, shift: 0.2, cam: [-7.5, 0.4, 6.5], look: [-3.8, 0, 0] },
  { id: 'smartmarket', formation: 'smartmarket', calm: 0.1, shift: 1.8, cam: [0, 0.5, 17], look: [0, 0, 0] },
  { id: 'swiflo', formation: 'swiflo', calm: 0.1, shift: 0, cam: [-2, 1.4, 11], look: [-1, 0, 0] },
  { id: 'stack', formation: 'engine', calm: 0.85, shift: 3.4, cam: [0, 5.5, 15], look: [0, 0, 0] },
  { id: 'architecture', formation: 'engine', calm: 0.7, shift: 3.2, cam: [0, 5.5, 15], look: [0, 0, 0] },
  { id: 'about', formation: 'quiet', calm: 0.9, shift: 3, cam: [0, 0, 16], look: [0, 0, 0] },
  { id: 'contact', formation: 'final', calm: 0.9, shift: 0, cam: [0, 0, 17], look: [0, 0, 0] },
]

export const store = {
  /** Smoothed scroll position in px. */
  scrollY: 0,
  scrollVelocity: 0,
  vh: 800,
  vw: 1200,
  pointer: { x: 0, y: 0, nx: 0, ny: 0 }, // nx/ny: -1..1 around viewport centre
  /** Weight state derived from scroll: A -> B interpolation. */
  a: 0,
  b: 0,
  t: 0,
  /** 0..1 progress inside the active project's section. */
  projectIndex: -1,
  projectProgress: 0,
  /** 0..1 progress through the contact shutdown sequence. */
  shutdown: 0,
  reduced: false,
  mobile: false,
  /** 0..1 quality scale adjusted by the frame monitor. */
  quality: 1,
  hidden: false,
  activeSection: 'hero',
}

type FrameListener = () => void
const listeners = new Set<FrameListener>()
export const onFrame = (fn: FrameListener) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
export const emitFrame = () => listeners.forEach((fn) => fn())

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
