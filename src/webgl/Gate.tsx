import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop } from 'three'
import { smoothstep, store } from '../lib/store'

const GRAY = new Color('#9aa0a4')
const GREEN = new Color('#7de2ff')

/**
 * TapGuard verification gate: three concentric rings that start misaligned, snap into
 * alignment as the signature is checked, then flash the accent for the VERIFIED state.
 */
export function Gate({ host }: { host: Group }) {
  const gate = useMemo(() => {
    const g = new Group()
    const radii = [2.6, 2.2, 1.8]
    const mats: LineBasicMaterial[] = []
    const rings = radii.map((r, i) => {
      const pts: number[] = []
      const seg = 96
      for (let k = 0; k < seg; k++) {
        const a = (k / seg) * Math.PI * 2
        pts.push(0, Math.cos(a) * r, Math.sin(a) * r)
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
      const mat = new LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })
      mats.push(mat)
      const ring = new LineLoop(geo, mat)
      ring.userData.i = i
      g.add(ring)
      return ring
    })
    return { g, rings, mats }
  }, [])

  useEffect(() => {
    return () => {
      gate.rings.forEach((r) => r.geometry.dispose())
      gate.mats.forEach((m) => m.dispose())
    }
  }, [gate])

  useFrame(() => {
    const w = (host.userData.wTap as number) ?? 0
    const p = store.projectIndex === 1 ? store.projectProgress : 0
    const align = smoothstep(0.22, 0.46, p)
    const flash = smoothstep(0.5, 0.55, p) * (1 - smoothstep(0.66, 0.88, p))
    gate.rings.forEach((r, i) => {
      const mis = (1 - align) * (0.55 + i * 0.5) * (store.reduced ? 0.3 : 1)
      r.rotation.x = mis
      r.rotation.y = (1 - align) * (0.25 + i * 0.18)
      const m = gate.mats[i]
      m.opacity = w * (0.16 + align * 0.18 + flash * 0.55)
      m.color.copy(GRAY).lerp(GREEN, flash)
    })
    gate.g.visible = w > 0.01
  })

  return <primitive object={gate.g} />
}
