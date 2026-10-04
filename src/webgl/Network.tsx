import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'
import { clamp, lerp, smoothstep, store } from '../lib/store'
import { STRIDE, buildFormations } from './formations'
import { view } from './cameraRig'
import { lineFragment, lineVertex, nodeFragment, nodeVertex } from './shaders'
import { Gate } from './Gate'
import { leadPosition } from './lead'

const BASE = new Color('#9aa0a4')
const ACCENT = new Color('#7de2ff')
const FINAL = 8
const TAP = 3

interface Packet {
  a: number
  b: number
  u: number
  speed: number
}

const TRAIL = 5
const LEAD_N = 12

export function Network({ count, packets: packetCount }: { count: number; packets: number }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  const sim = useMemo(() => {
    const f = buildFormations(count)
    const N = f.N
    const pos = new BufferAttribute(new Float32Array(N * 3), 3).setUsage(DynamicDrawUsage)
    const size = new BufferAttribute(new Float32Array(N), 1).setUsage(DynamicDrawUsage)
    const sig = new BufferAttribute(new Float32Array(N * 2), 2).setUsage(DynamicDrawUsage)

    const nodeGeo = new BufferGeometry()
    nodeGeo.setAttribute('position', pos)
    nodeGeo.setAttribute('aSize', size)
    nodeGeo.setAttribute('aSig', sig)

    const mkLine = () => {
      const g = new BufferGeometry()
      g.setAttribute('position', pos)
      g.setAttribute('aSize', size)
      g.setAttribute('aSig', sig)
      g.setIndex(new BufferAttribute(new Uint32Array(f.maxEdges * 2), 1))
      g.setDrawRange(0, 0)
      const m = new ShaderMaterial({
        vertexShader: lineVertex,
        fragmentShader: lineFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uBase: { value: BASE }, uAccent: { value: ACCENT }, uOpacity: { value: 0 } },
      })
      const l = new LineSegments(g, m)
      l.frustumCulled = false
      return l
    }
    const lineA = mkLine()
    const lineB = mkLine()

    const nodeMat = new ShaderMaterial({
      vertexShader: nodeVertex,
      fragmentShader: nodeFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uScale: { value: 80 }, uAlpha: { value: 1 }, uBase: { value: BASE }, uAccent: { value: ACCENT } },
    })
    const nodePoints = new Points(nodeGeo, nodeMat)
    nodePoints.frustumCulled = false

    // packets (head + short trail) share the node shader
    const M = packetCount * TRAIL
    const pPos = new BufferAttribute(new Float32Array(M * 3), 3).setUsage(DynamicDrawUsage)
    const pSize = new BufferAttribute(new Float32Array(M), 1).setUsage(DynamicDrawUsage)
    const pSig = new BufferAttribute(new Float32Array(M * 2), 2).setUsage(DynamicDrawUsage)
    const pGeo = new BufferGeometry()
    pGeo.setAttribute('position', pPos)
    pGeo.setAttribute('aSize', pSize)
    pGeo.setAttribute('aSig', pSig)
    const pMat = nodeMat.clone()
    pMat.uniforms = { uScale: { value: 80 }, uAlpha: { value: 1 }, uBase: { value: new Color('#ffffff') }, uAccent: { value: ACCENT } }
    const pPoints = new Points(pGeo, pMat)
    pPoints.frustumCulled = false

    // lead packet (head + long trail), driven by narrative progress rather than random edges
    const lPos = new BufferAttribute(new Float32Array(LEAD_N * 3), 3).setUsage(DynamicDrawUsage)
    const lSize = new BufferAttribute(new Float32Array(LEAD_N), 1).setUsage(DynamicDrawUsage)
    const lSig = new BufferAttribute(new Float32Array(LEAD_N * 2), 2).setUsage(DynamicDrawUsage)
    const lGeo = new BufferGeometry()
    lGeo.setAttribute('position', lPos)
    lGeo.setAttribute('aSize', lSize)
    lGeo.setAttribute('aSig', lSig)
    const lPoints = new Points(lGeo, pMat)
    lPoints.frustumCulled = false
    const group = new Group()
    group.add(lineA, lineB, nodePoints, pPoints, lPoints)
    const pk: Packet[] = Array.from({ length: packetCount }, () => ({ a: 0, b: 0, u: 1, speed: 0.4 }))

    return {
      f, N, pos, size, sig, nodeGeo, lineA, lineB, nodeMat, nodePoints,
      pPos, pSize, pSig, pGeo, pMat, pPoints, pk, lPos, lSize, lSig, lGeo,
      cur: new Float32Array(N * 3),
      lastA: -1, lastB: -1, lastDom: -1,
      group,
    }
  }, [count, packetCount])

  useEffect(() => {
    return () => {
      sim.nodeGeo.dispose()
      sim.lineA.geometry.dispose()
      sim.lineB.geometry.dispose()
      ;(sim.lineA.material as ShaderMaterial).dispose()
      ;(sim.lineB.material as ShaderMaterial).dispose()
      sim.nodeMat.dispose()
      sim.pGeo.dispose()
      sim.lGeo.dispose()
      sim.pMat.dispose()
    }
  }, [sim])

  const tmp = useMemo(() => new Vector3(), [])

  useFrame((state, dtRaw) => {
    if (store.hidden) return
    const dt = Math.min(dtRaw, 0.05)
    const time = state.clock.elapsedTime
    const { f, N, pos, size, sig, cur, group, pk } = sim
    const a = store.a
    const b = store.b
    const t = store.t
    const fa = f.data[a]
    const fb = f.data[b]
    const calm = view.calm
    const reduced = store.reduced

    // ── world group transform ──
    const px = store.pointer.nx
    const py = store.pointer.ny
    group.position.x = view.shift
    group.scale.setScalar(view.scale)
    const pointerOn = !reduced && !store.mobile
    group.rotation.y = pointerOn ? px * 0.13 + Math.sin(time * 0.17) * 0.05 : 0
    group.rotation.x = pointerOn ? -py * 0.08 : 0
    group.updateMatrixWorld()

    // ── formation weights ──
    const wFinal = (a === FINAL ? 1 - t : 0) + (b === FINAL ? t : 0)
    const wTap = (a === TAP ? 1 - t : 0) + (b === TAP ? t : 0)

    // contact shutdown 100 -> 30 -> 10 -> 3 -> 1
    const s = store.shutdown
    const stops = [1, 0.3, 0.1, 0.03, 0.004]
    const si = clamp(s * 4, 0, 3.9999)
    const sI = Math.floor(si)
    const frac = Math.exp(lerp(Math.log(stops[sI]), Math.log(stops[sI + 1]), smoothstep(0, 1, si - sI)))

    // pulse wave progress per formation
    const projP = (fi: number) => {
      if (fi >= 2 && fi <= 5) return store.projectIndex === fi - 2 ? store.projectProgress : fi === a ? 1 : 0
      return 1
    }
    const ambient = ((time * 0.06) % 1) * 1.2 - 0.1
    const glowAmt = 1 - calm * 0.65
    const sigOf = (fi: number, o: number, out: number) => {
      const isProject = fi >= 2 && fi <= 5
      const pg = isProject ? projP(fi) : ambient
      const pv = isProject ? projP(fi) * 1.03 : 1
      const d = (o - pg) / 0.05
      const glow = Math.exp(-d * d) * glowAmt
      const green = o > 0.955 ? smoothstep(o - 0.05, o, pv) : 0
      return out === 0 ? glow : green
    }

    const scatter = reduced ? 0 : Math.sin(Math.PI * t) * (store.mobile ? 1.6 : 2.6)
    const drift = reduced ? 0 : 0.07 * (1 - calm * 0.5)
    const speedEnv = reduced ? 0.25 : 1

    const doPointer = pointerOn && wFinal < 0.5
    const aspect = state.size.width / state.size.height

    for (let i = 0; i < N; i++) {
      const k = i * STRIDE
      let x = fa[k] + (fb[k] - fa[k]) * t
      let y = fa[k + 1] + (fb[k + 1] - fa[k + 1]) * t
      let z = fa[k + 2] + (fb[k + 2] - fa[k + 2]) * t
      let sz = fa[k + 3] + (fb[k + 3] - fa[k + 3]) * t
      if (scatter > 0) {
        x += f.dirs[i * 3] * scatter
        y += f.dirs[i * 3 + 1] * scatter * 0.8
        z += f.dirs[i * 3 + 2] * scatter
      }
      if (drift > 0) {
        const ph = f.phase[i]
        x += Math.sin(time * 0.4 + ph) * drift
        y += Math.cos(time * 0.33 + ph * 1.3) * drift
        z += Math.sin(time * 0.28 + ph * 0.7) * drift
      }
      if (doPointer && sz > 0.01) {
        tmp.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera)
        const dx = tmp.x - px
        const dy = tmp.y - py
        const d = Math.sqrt(dx * dx * aspect * aspect + dy * dy)
        if (d < 0.3) {
          const w = (1 - d / 0.3) ** 2
          x += dx * 2.2 * w
          y += dy * 2.2 * w
          z += w * 0.4
        }
      }
      // contact shutdown: nodes switch off by rank
      if (wFinal > 0) {
        const keep = f.rank[i] < frac ? 1 : 0
        sz *= lerp(1, keep, wFinal)
      }
      const ci = i * 3
      cur[ci] = x
      cur[ci + 1] = y
      cur[ci + 2] = z
      pos.array[ci] = x
      pos.array[ci + 1] = y
      pos.array[ci + 2] = z
      size.array[i] = sz
      const oA = fa[k + 4]
      const oB = fb[k + 4]
      sig.array[i * 2] = lerp(sigOf(a, oA, 0), sigOf(b, oB, 0), t)
      sig.array[i * 2 + 1] = lerp(sigOf(a, oA, 1), sigOf(b, oB, 1), t)
    }
    pos.needsUpdate = true
    size.needsUpdate = true
    sig.needsUpdate = true

    // ── edge sets ──
    const { lineA, lineB } = sim
    if (sim.lastA !== a) {
      const idx = (lineA.geometry.index as BufferAttribute)
      idx.array.set(f.edges[a])
      idx.needsUpdate = true
      lineA.geometry.setDrawRange(0, f.edges[a].length)
      sim.lastA = a
    }
    if (sim.lastB !== b) {
      const idx = (lineB.geometry.index as BufferAttribute)
      idx.array.set(f.edges[b])
      idx.needsUpdate = true
      lineB.geometry.setDrawRange(0, f.edges[b].length)
      sim.lastB = b
    }
    const edgeBase = 0.6 * (1 - calm * 0.35)
    const fadeFinal = (fi: number) => (fi === FINAL ? 1 - smoothstep(0, 0.45, s) : 1)
    ;(lineA.material as ShaderMaterial).uniforms.uOpacity.value = a === b ? edgeBase * fadeFinal(a) : (1 - t) * edgeBase * fadeFinal(a)
    ;(lineB.material as ShaderMaterial).uniforms.uOpacity.value = a === b ? 0 : t * edgeBase * fadeFinal(b)

    // ── packets ──
    const dom = t < 0.5 ? a : b
    const edges = f.edges[dom]
    const edgeCount = edges.length / 2
    const domData = f.data[dom]
    if (sim.lastDom !== dom) {
      sim.lastDom = dom
      for (const p of pk) p.u = 1
    }
    const active = Math.floor(pk.length * (1 - calm * 0.75) * (reduced ? 0.4 : 1) * (1 - smoothstep(0.05, 0.4, s) * wFinal) * store.quality)
    const { pPos, pSize, pSig } = sim
    for (let q = 0; q < pk.length; q++) {
      const p = pk[q]
      let alive = q < active && edgeCount > 0
      if (alive) {
        p.u += dt * p.speed * speedEnv
        if (p.u >= 1) {
          const e = Math.floor(Math.random() * edgeCount)
          let na = edges[e * 2]
          let nb = edges[e * 2 + 1]
          if (domData[na * STRIDE + 4] > domData[nb * STRIDE + 4]) [na, nb] = [nb, na]
          p.a = na
          p.b = nb
          p.u = 0
          p.speed = 0.35 + Math.random() * 0.55
        }
      } else alive = false
      for (let r = 0; r < TRAIL; r++) {
        const o = (q * TRAIL + r)
        if (!alive) {
          pSize.array[o] = 0
          continue
        }
        const u = clamp(p.u - r * 0.07, 0, 1)
        const ia = p.a * 3
        const ib = p.b * 3
        pPos.array[o * 3] = lerp(cur[ia], cur[ib], u)
        pPos.array[o * 3 + 1] = lerp(cur[ia + 1], cur[ib + 1], u)
        pPos.array[o * 3 + 2] = lerp(cur[ia + 2], cur[ib + 2], u)
        const head = r === 0 ? 1 : 0
        const vis = Math.min(size.array[p.a], size.array[p.b]) > 0.2 ? 1 : 0
        pSize.array[o] = (head ? 0.95 : 0.62 * (1 - r / TRAIL)) * vis * (p.u > 0.02 ? 1 : 0)
        pSig.array[o * 2] = head ? 0.8 : 0.2
        pSig.array[o * 2 + 1] = sig.array[p.b * 2 + 1] > 0.6 ? 1 : 0
      }
    }
    pPos.needsUpdate = true
    pSize.needsUpdate = true
    pSig.needsUpdate = true

    // lead packet
    {
      let fi = -1
      let w = 0
      for (const q of [3, 5]) {
        const wq = (a === q ? 1 - t : 0) + (b === q ? t : 0)
        if (wq > w) {
          w = wq
          fi = q
        }
      }
      const lp = fi >= 0 ? projP(fi) : 0
      const { lPos, lSize, lSig } = sim
      const out: [number, number, number] = [0, 0, 0]
      const green = fi === 3 ? smoothstep(0.53, 0.58, lp) : smoothstep(0.9, 0.96, lp)
      for (let r = 0; r < LEAD_N; r++) {
        const ok = fi >= 0 && w > 0.02 && leadPosition(fi, lp - r * (reduced ? 0.004 : 0.012), out)
        if (!ok) {
          lSize.array[r] = 0
          continue
        }
        lPos.array[r * 3] = out[0]
        lPos.array[r * 3 + 1] = out[1]
        lPos.array[r * 3 + 2] = out[2]
        lSize.array[r] = (r === 0 ? 2.1 : 1.1 * (1 - r / LEAD_N)) * w
        lSig.array[r * 2] = r === 0 ? 1 : 0.4
        lSig.array[r * 2 + 1] = green
      }
      lPos.needsUpdate = true
      lSize.needsUpdate = true
      lSig.needsUpdate = true
    }

    const dpr = gl.getPixelRatio()
    const scale = 175 * dpr * (store.mobile ? 0.8 : 1)
    sim.nodeMat.uniforms.uScale.value = scale
    sim.pMat.uniforms.uScale.value = scale

    sim.group.userData.wTap = wTap
  })

  return (
    <primitive object={sim.group}>
      <Gate host={sim.group} />
    </primitive>
  )
}
