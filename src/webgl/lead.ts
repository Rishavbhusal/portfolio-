import { clamp, lerp } from '../lib/store'

/**
 * "Lead" packets: the single signal (TapGuard) / value packet (Swiflo) the camera rides along.
 * Control points map narrative progress -> x so the packet, the pulse wave and the camera agree.
 */
type Pt = [number, number]

const TAP: Pt[] = [[0, -8.8], [0.1, -7.6], [0.3, -4], [0.5, -1.5], [0.55, 0], [0.62, 2.4], [0.78, 4], [0.85, 5.5], [1, 9.6]]
const SWIFLO: Pt[] = [[0, -9.4], [0.05, -9], [0.85, 9], [0.97, 9.4], [1, 9.4]]

function sample(pts: Pt[], p: number) {
  const q = clamp(p)
  for (let i = 1; i < pts.length; i++) {
    if (q <= pts[i][0]) {
      const [p0, x0] = pts[i - 1]
      const [p1, x1] = pts[i]
      return lerp(x0, x1, (q - p0) / Math.max(1e-6, p1 - p0))
    }
  }
  return pts[pts.length - 1][1]
}

export const swifloY = (x: number) => 1.1 * Math.sin(((x + 9) / 18) * 5.5)
export const swifloZ = (x: number) => Math.cos(((x + 9) / 18) * 4) * 0.6

export const tapX = (p: number) => sample(TAP, p)
export const swifloX = (p: number) => sample(SWIFLO, p)

/** formation index -> position of the lead packet at progress p (group-local space), or null. */
export function leadPosition(formation: number, p: number, out: [number, number, number]) {
  if (formation === 3) {
    const x = tapX(p)
    out[0] = x
    out[1] = 0
    out[2] = 0
    return true
  }
  if (formation === 5) {
    const x = swifloX(p)
    out[0] = x
    out[1] = swifloY(x)
    out[2] = swifloZ(x)
    return true
  }
  return false
}
