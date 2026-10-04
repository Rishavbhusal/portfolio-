import { FORMATIONS, type Formation } from '../lib/store'
import { swifloY, swifloZ } from './lead'

/**
 * Procedural node formations. Every node keeps its identity across the whole page;
 * a formation just says where that node lives, how large it is, and its "order"
 * (position in the narrative sequence: sensor -> ... -> settled state).
 *
 * Per node per formation: [x, y, z, size, order]
 *   size  0 hides the node
 *   order 0..1 drives the pulse wave; order > 0.9 marks a "verified / settled" node
 */
export const STRIDE = 5

export interface FormationSet {
  N: number
  data: Float32Array[]
  edges: Uint32Array[]
  /** Random rank per node, used by the contact shutdown (rank 0 survives to the end). */
  rank: Float32Array
  /** Random unit directions for transition scatter. */
  dirs: Float32Array
  phase: Float32Array
  maxEdges: number
  /** Location of the TapGuard verification gate in world space. */
  gate: [number, number, number]
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildFormations(N: number, seed = 7): FormationSet {
  const rnd = mulberry32(seed)
  const gauss = () => {
    let u = 0
    for (let i = 0; i < 4; i++) u += rnd()
    return (u - 2) * 1.2
  }
  const ease = (x: number) => x * x * (3 - 2 * x)

  type Buf = Float32Array
  const make = (): Buf => new Float32Array(N * STRIDE)
  const set = (b: Buf, i: number, x: number, y: number, z: number, s: number, o: number) => {
    const k = i * STRIDE
    b[k] = x
    b[k + 1] = y
    b[k + 2] = z
    b[k + 3] = s
    b[k + 4] = o
  }
  /** Fill leftover nodes with faint ambient dust so formations stay continuous. */
  const dust = (b: Buf, from: number, rMin: number, rMax: number, size: number, flat = 1) => {
    for (let i = from; i < N; i++) {
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      const r = rMin + rnd() * (rMax - rMin)
      set(b, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * flat, r * Math.sin(ph) * Math.sin(th), size * (0.6 + rnd() * 0.8), rnd() * 0.85)
    }
  }

  // ── CORE ── layered octahedral lattice shell around a nucleus, plus two orbit rings.
  const core = make()
  const coreRole = new Uint8Array(N) // 1 = shell, 2 = nucleus, 3 = orbit
  const coreEdgeList: [number, number][] = []
  {
    const target = Math.floor(N * 0.62)
    let R = 3
    const count = (r: number) => ((2 * r + 1) * (2 * r * r + 2 * r + 3)) / 3
    while (count(R + 1) <= target * 1.15) R++
    const s = 4.2 / R
    let n = 0
    const at = new Map<string, number>()
    for (let i = -R; i <= R; i++)
      for (let j = -R; j <= R; j++)
        for (let k = -R; k <= R; k++) {
          const l1 = Math.abs(i) + Math.abs(j) + Math.abs(k)
          const nucleus = l1 <= 1
          const shell = l1 >= R - 1 && l1 <= R
          if ((nucleus || shell) && n < N) {
            const wob = 0.0
            set(core, n, i * s + wob, j * s * 1.08, k * s, nucleus ? 1.5 : 0.82, nucleus ? (l1 === 0 ? 0.995 : 0.97 + rnd() * 0.02) : rnd() * 0.8)
            coreRole[n] = nucleus ? 2 : 1
            at.set(`${i},${j},${k}`, n)
            n++
          }
        }
    // strict lattice adjacency keeps the structure crisp
    at.forEach((idx, key) => {
      const [i, j, k] = key.split(',').map(Number)
      for (const nb of [`${i + 1},${j},${k}`, `${i},${j + 1},${k}`, `${i},${j},${k + 1}`]) {
        const o = at.get(nb)
        if (o !== undefined) coreEdgeList.push([idx, o])
      }
    })
    // spokes: nucleus axes -> shell, like buses through the hollow
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const a = at.get(`${dx},${dy},${dz}`)
      const b = at.get(`${dx * (R - 1)},${dy * (R - 1)},${dz * (R - 1)}`)
      if (a !== undefined && b !== undefined) coreEdgeList.push([a, b])
    }
    const ringN = Math.floor((N - n) * 0.55)
    for (let r = 0; r < ringN && n < N; r++, n++) {
      const ringIdx = r % 2
      const a = (r / ringN) * Math.PI * 4 + ringIdx
      const rad = 4.9 + ringIdx * 0.9
      const tilt = ringIdx ? 0.9 : -0.55
      const x = Math.cos(a) * rad
      const y0 = Math.sin(a) * rad
      set(core, n, x, y0 * Math.cos(tilt), y0 * Math.sin(tilt), 0.7, rnd() * 0.8)
      coreRole[n] = 3
      if (r >= 2) coreEdgeList.push([n - 2, n])
    }
    dust(core, n, 6.5, 12, 0.5)
  }

  // ── OPEN ── the core splits: shell stretches, halves separate, some nodes pass through depth.
  const open = make()
  for (let i = 0; i < N; i++) {
    const k = i * STRIDE
    const x = core[k], y = core[k + 1], z = core[k + 2]
    const sgn = x >= 0 ? 1 : -1
    const depth = (rnd() - 0.45) * 5
    set(open, i, x * 2.1 + sgn * 1.3, y * 1.6, z * 2.0 + depth, core[k + 3] * (coreRole[i] === 3 ? 0.8 : 1), core[k + 4])
  }

  // ── VERIX ── IoT sensors -> telemetry streams converge -> agents -> market -> on-chain chain.
  const verix = make()
  const verixEdgeList: [number, number][] = []
  {
    let n = 0
    const centres: [number, number, number][] = [
      [-9, 3, -1], [-8.2, -2.6, 1.5], [-10, 0.4, 3.2], [-7, 4.2, 2], [-9.6, -4, -2], [-6.6, -0.6, -3],
    ]
    const streams = centres.length
    const sensStart = n
    const sens = Math.floor(N * 0.3)
    for (let i = 0; i < sens; i++, n++) {
      const c = centres[i % streams]
      set(verix, n, c[0] + gauss() * 1.0, c[1] + gauss() * 0.9, c[2] + gauss() * 0.9, 0.8, rnd() * 0.16)
    }
    // telemetry: ordered chains per stream so the flow reads as clean lines
    const perStream = Math.floor((N * 0.3) / streams)
    const heads: number[][] = []
    const tails: number[] = []
    for (let s = 0; s < streams; s++) {
      const c = centres[s]
      const chain: number[] = []
      for (let i = 0; i < perStream; i++, n++) {
        const u = (i + 1) / (perStream + 1)
        const e = ease(u)
        set(verix, n, c[0] + (-1.6 - c[0]) * e + gauss() * 0.05, c[1] * (1 - e) + gauss() * 0.05, c[2] * (1 - e) + gauss() * 0.05, 0.55, 0.17 + u * 0.32)
        if (chain.length) verixEdgeList.push([chain[chain.length - 1], n])
        chain.push(n)
      }
      heads.push(chain.slice(0, 3))
      tails.push(chain[chain.length - 1])
    }
    for (let i = 0; i < sens; i++) {
      const hs = heads[i % streams]
      verixEdgeList.push([sensStart + i, hs[Math.floor(rnd() * hs.length)]])
    }
    const agents = Math.max(8, Math.floor(N * 0.06))
    const agentStart = n
    for (let i = 0; i < agents; i++, n++) {
      const a = (i / agents) * Math.PI * 2
      set(verix, n, 1.8 + gauss() * 0.05, Math.cos(a) * 1.7, Math.sin(a) * 1.7, 1.3, 0.5 + rnd() * 0.12)
      verixEdgeList.push([n, agentStart + ((i + 1) % agents)])
      if (i % 3 === 0) verixEdgeList.push([n, agentStart + ((i + 3) % agents)])
    }
    tails.forEach((t, s) => {
      for (let q = 0; q < 2; q++) verixEdgeList.push([t, agentStart + Math.floor(((s + q * 0.5) / streams) * agents) % agents])
    })
    const marketStart = n
    const market = Math.floor(N * 0.06)
    for (let i = 0; i < market; i++, n++) {
      set(verix, n, 4.4 + gauss() * 0.55, gauss() * 0.7, gauss() * 0.7, 1.0, 0.64 + rnd() * 0.16)
      if (i > 0) verixEdgeList.push([n, marketStart + Math.floor(rnd() * i)])
    }
    for (let i = 0; i < agents; i += 2) verixEdgeList.push([agentStart + i, marketStart + Math.floor(rnd() * market)])
    const chainStart = n
    const chain = Math.floor(N * 0.1)
    for (let i = 0; i < chain; i++, n++) {
      const u = i / (chain - 1)
      set(verix, n, 6.2 + u * 3.4, ((i % 3) - 1) * 0.62, 0, 1.15, 0.86 + u * 0.14)
      if (i >= 3) verixEdgeList.push([n - 3, n])
      if (i % 3 && i > 0) verixEdgeList.push([n - 1, n])
    }
    for (let i = 0; i < 3; i++) verixEdgeList.push([marketStart + Math.floor(rnd() * market), chainStart + i])
    dust(verix, n, 7, 13, 0.45)
  }

  // ── TAPGUARD ── one signal travels left -> right through verification into the Solana topology.
  const tapguard = make()
  let gate: [number, number, number] = [0, 0, 0]
  {
    let n = 0
    const nfc = Math.floor(N * 0.07)
    for (let i = 0; i < nfc; i++, n++) {
      const ring = i % 3
      const a = (i / nfc) * Math.PI * 6
      const r = 0.5 + ring * 0.45
      set(tapguard, n, -8.6 + ring * 0.15, Math.cos(a) * r, Math.sin(a) * r, 1.0, rnd() * 0.1)
    }
    const sig = Math.floor(N * 0.1)
    for (let i = 0; i < sig; i++, n++) {
      const u = i / sig
      const a = u * Math.PI * 10
      set(tapguard, n, -7.5 + u * 3.3, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.6, 0.1 + u * 0.2)
    }
    const sg = Math.floor(N * 0.08)
    for (let i = 0; i < sg; i++, n++) {
      const u = i / sg
      set(tapguard, n, -4 + u * 2.4, Math.sin(u * Math.PI * 4) * 0.85, 0, 0.85, 0.3 + u * 0.2)
    }
    const gateN = Math.max(12, Math.floor(N * 0.07))
    gate = [0, 0, 0]
    for (let i = 0; i < gateN; i++, n++) {
      const a = (i / gateN) * Math.PI * 2
      set(tapguard, n, 0, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 1.1, 0.5 + (i / gateN) * 0.1)
    }
    for (let ix = 0; ix < 3; ix++)
      for (let iy = 0; iy < 3; iy++)
        for (let iz = 0; iz < 3; iz++, n++) {
          if (n >= N) break
          set(tapguard, n, 3.2 + (ix - 1) * 0.75, (iy - 1) * 0.75, (iz - 1) * 0.75, 0.95, 0.62 + (ix + iy + iz) * 0.025)
        }
    const sol = Math.floor(N * 0.27)
    for (let i = 0; i < sol && n < N; i++, n++) {
      const x = 5 + rnd() * 5
      set(tapguard, n, x, (rnd() - 0.5) * 8, (rnd() - 0.5) * 6, 0.8, 0.74 + Math.pow((x - 5) / 5, 3) * 0.26)
    }
    dust(tapguard, n, 8, 14, 0.4)
  }

  // ── SMARTMARKET ── three agent clusters coordinate; settlement ring resolves at the centre.
  const smart = make()
  {
    let n = 0
    const cl: [number, number, number, number][] = [
      [-5.4, 2.8, 0, 0.08],
      [5.4, 3.2, -1, 0.32],
      [0.2, -4.2, 1.5, 0.36],
    ]
    const per = Math.floor(N * 0.16)
    for (const c of cl)
      for (let i = 0; i < per; i++, n++) set(smart, n, c[0] + gauss() * 0.95, c[1] + gauss() * 0.95, c[2] + gauss() * 0.95, 0.85, c[3] + rnd() * 0.14)
    const task = 4
    for (let i = 0; i < task; i++, n++) set(smart, n, gauss() * 0.3, 5.8 + gauss() * 0.3, gauss() * 0.3, 1.3, rnd() * 0.04)
    // message bridges between clusters
    const bridges = Math.floor(N * 0.14)
    for (let i = 0; i < bridges; i++, n++) {
      const a = cl[i % 3]
      const b = cl[(i + 1 + (i % 2)) % 3]
      const u = rnd()
      set(smart, n, a[0] + (b[0] - a[0]) * u + gauss() * 0.12, a[1] + (b[1] - a[1]) * u + gauss() * 0.12, a[2] + (b[2] - a[2]) * u + gauss() * 0.12, 0.45, a[3] + 0.14 + u * 0.16)
    }
    const ringN = Math.max(10, Math.floor(N * 0.09))
    for (let i = 0; i < ringN; i++, n++) {
      const a = (i / ringN) * Math.PI * 2
      set(smart, n, Math.cos(a) * 1.15, 0.3, Math.sin(a) * 1.15, 1.15, 0.82 + (i / ringN) * 0.18)
    }
    set(smart, n++, 0, 0.3, 0, 1.7, 0.995)
    dust(smart, n, 8, 14, 0.4)
  }

  // ── SWIFLO ── a controlled value packet flows along a path, an oracle stream crosses it, backend beneath.
  const swiflo = make()
  const pathY = swifloY
  {
    let n = 0
    const flow = Math.floor(N * 0.38)
    for (let i = 0; i < flow; i++, n++) {
      const u = rnd()
      const x = -9 + u * 18
      set(swiflo, n, x + gauss() * 0.06, pathY(x) + gauss() * 0.28, swifloZ(x) + gauss() * 0.28, 0.6, 0.05 + u * 0.8)
    }
    const ends = Math.floor(N * 0.05)
    for (let i = 0; i < ends; i++, n++) set(swiflo, n, -9.4 + gauss() * 0.4, pathY(-9) + gauss() * 0.4, gauss() * 0.4, 1.0, rnd() * 0.06)
    for (let i = 0; i < ends; i++, n++) set(swiflo, n, 9.4 + gauss() * 0.35, pathY(9) + gauss() * 0.35, gauss() * 0.35, 1.15, 0.97 + rnd() * 0.03)
    const oracle = Math.floor(N * 0.1)
    for (let i = 0; i < oracle; i++, n++) {
      const v = i / oracle
      set(swiflo, n, -1.5 + gauss() * 0.1, 6 + (pathY(-1.5) - 6) * v, gauss() * 0.15, 0.7, 0.2 + (1 - v) * 0.2)
    }
    const grid = Math.floor(N * 0.2)
    const cols = Math.ceil(Math.sqrt(grid * 2.6))
    for (let i = 0; i < grid; i++, n++) {
      const cx = i % cols
      const cz = Math.floor(i / cols)
      set(swiflo, n, -8 + (cx / cols) * 16, -3.4, -3 + (cz / Math.ceil(grid / cols)) * 6, 0.6, 0.5 + rnd() * 0.38)
    }
    dust(swiflo, n, 8, 14, 0.4)
  }

  // ── ENGINE ── five architecture layers, order flows top (client) to bottom (async).
  const engine = make()
  {
    let n = 0
    const layers = 5
    const per = Math.floor(N * 0.14)
    for (let l = 0; l < layers; l++) {
      const cols = Math.ceil(Math.sqrt((per * 11) / 4))
      for (let i = 0; i < per; i++, n++) {
        const cx = i % cols
        const cz = Math.floor(i / cols)
        const rows = Math.ceil(per / cols)
        const last = l === layers - 1 && i < 3
        set(engine, n, -5.5 + (cx / (cols - 1)) * 11 + gauss() * 0.05, 3.6 - l * 1.8, -2 + (cz / Math.max(1, rows - 1)) * 4, last ? 1.3 : 0.75, last ? 0.98 : 0.08 + (l / (layers - 1)) * 0.8 + rnd() * 0.06)
      }
    }
    dust(engine, n, 8, 14, 0.4)
  }

  // ── QUIET ── sparse, calm field behind the About section.
  const quiet = make()
  for (let i = 0; i < N; i++) {
    const th = rnd() * Math.PI * 2
    const r = 6 + rnd() * 8
    const keep = i < N * 0.42
    set(quiet, i, Math.cos(th) * r, (rnd() - 0.5) * 9, Math.sin(th) * r - 4, keep ? 0.6 : 0.3, rnd() * 0.85)
  }
  set(quiet, 0, 0, 0, 0, 1.4, 0.995)

  // ── FINAL ── a wide field that the contact section shuts down to one node.
  const final = make()
  for (let i = 0; i < N; i++) {
    const th = rnd() * Math.PI * 2
    const ph = Math.acos(2 * rnd() - 1)
    const r = 3 + rnd() * 9
    set(final, i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th), 0.6 + rnd() * 0.3, rnd() * 0.85)
  }
  set(final, 0, 0, 0, 0, 2.0, 0.995)

  const byName: Record<Formation, Float32Array> = { core, open, verix, tapguard, smartmarket: smart, swiflo, engine, quiet, final }
  const data = FORMATIONS.map((f) => byName[f])

  // ── edges ──
  const knn = (b: Float32Array, k: number, maxD: number, minSize: number, cap: number, extra: [number, number][] = []) => {
    const out: [number, number][] = []
    const seen = new Set<number>()
    const add = (a: number, c: number) => {
      const key = a < c ? a * N + c : c * N + a
      if (a === c || seen.has(key)) return
      seen.add(key)
      out.push([a, c])
    }
    const m2 = maxD * maxD
    for (let i = 0; i < N; i++) {
      if (b[i * STRIDE + 3] < minSize) continue
      const best: [number, number][] = []
      for (let j = 0; j < N; j++) {
        if (j === i || b[j * STRIDE + 3] < minSize) continue
        const dx = b[i * STRIDE] - b[j * STRIDE]
        const dy = b[i * STRIDE + 1] - b[j * STRIDE + 1]
        const dz = b[i * STRIDE + 2] - b[j * STRIDE + 2]
        const d = dx * dx + dy * dy + dz * dz
        if (d > m2) continue
        best.push([d, j])
      }
      best.sort((x, y) => x[0] - y[0])
      for (let q = 0; q < Math.min(k, best.length); q++) add(i, best[q][1])
    }
    for (const [a, c] of extra) add(a, c)
    return out.slice(0, cap)
  }
  const pairRandom = (aFrom: number, aTo: number, bFrom: number, bTo: number, count: number) => {
    const r: [number, number][] = []
    for (let i = 0; i < count; i++) r.push([aFrom + Math.floor(rnd() * (aTo - aFrom)), bFrom + Math.floor(rnd() * (bTo - bFrom))])
    return r
  }

  const cap = Math.floor(N * 2.4)
  const eCore = coreEdgeList
  const eOpen = eCore.filter(() => rnd() < 0.5)
  const eVerix = verixEdgeList
  const eTap = knn(tapguard, 2, 1.5, 0.55, cap)
  const eSmart = knn(smart, 2, 1.7, 0.4, cap, [
    ...pairRandom(0, Math.floor(N * 0.16), Math.floor(N * 0.16), Math.floor(N * 0.32), 10),
    ...pairRandom(Math.floor(N * 0.16), Math.floor(N * 0.32), Math.floor(N * 0.32), Math.floor(N * 0.48), 10),
    ...pairRandom(Math.floor(N * 0.32), Math.floor(N * 0.48), 0, Math.floor(N * 0.16), 10),
  ])
  const eSwiflo = knn(swiflo, 2, 1.4, 0.5, cap)
  const eEngine = knn(engine, 2, 1.9, 0.6, cap)
  const eQuiet = knn(quiet, 1, 3.4, 0.5, Math.floor(N * 0.5))
  const eFinal = knn(final, 1, 3.4, 0.5, Math.floor(N * 0.6))
  const edgeLists = [eCore, eOpen, eVerix, eTap, eSmart, eSwiflo, eEngine, eQuiet, eFinal]
  const edges = FORMATIONS.map((_, i) => {
    const arr = new Uint32Array(edgeLists[i].length * 2)
    edgeLists[i].forEach(([a, b], q) => {
      arr[q * 2] = a
      arr[q * 2 + 1] = b
    })
    return arr
  })

  const rank = new Float32Array(N)
  const dirs = new Float32Array(N * 3)
  const phase = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    rank[i] = i === 0 ? -1 : rnd()
    const th = rnd() * Math.PI * 2
    const ph = Math.acos(2 * rnd() - 1)
    dirs[i * 3] = Math.sin(ph) * Math.cos(th)
    dirs[i * 3 + 1] = Math.cos(ph)
    dirs[i * 3 + 2] = Math.sin(ph) * Math.sin(th)
    phase[i] = rnd() * Math.PI * 2
  }

  return { N, data, edges, rank, dirs, phase, maxEdges: Math.max(...edges.map((e) => e.length / 2)), gate }
}
