import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import { clamp, lerp, sectionKeys, smoothstep, store } from '../lib/store'
import { driver } from '../lib/scrollDriver'
import { swifloX, tapX } from './lead'

/**
 * Camera storytelling. Each section key has a resting pose; the four project sections
 * additionally move the camera along their narrative (convergence, signal, pull-back, packet).
 */
const PROJECT_IDS = ['verix', 'tapguard', 'smartmarket', 'swiflo']
const tmpA = new Vector3()
const tmpB = new Vector3()
const tmpLook = new Vector3()
const smoothPos = new Vector3(0, 0.4, 13)
const smoothLook = new Vector3()
let primed = false

export interface ViewState {
  calm: number
  shift: number
  scale: number
}
export const view: ViewState = { calm: 0.2, shift: 0, scale: 1 }

function pose(index: number, outPos: Vector3, outLook: Vector3) {
  const k = sectionKeys[index]
  outPos.set(...k.cam)
  outLook.set(...k.look)
  const motion = store.reduced ? 0.25 : store.mobile ? 0.6 : 1
  const pi = PROJECT_IDS.indexOf(k.id)
  const p = pi < 0 ? 0 : store.projectIndex === pi ? store.projectProgress : index === driver.keyIndexA ? 1 : 0
  switch (k.id) {
    case 'verix': {
      // follow the information as it converges left -> right
      const x = lerp(-4, 5.4, p) * motion
      outLook.x += x
      outPos.x += x * 0.7
      break
    }
    case 'tapguard': {
      // ride behind a single signal, keeping it right of centre
      const lx = tapX(p)
      outLook.set(lx - 2.1 * motion, 0, 0)
      outPos.set(outLook.x - 3.2, 0.5 + p * 0.3, 6.6)
      break
    }
    case 'smartmarket': {
      // start close on one agent, pull back to reveal the whole coordination
      outPos.z = lerp(11 + (1 - motion) * 6, 18, smoothstep(0.05, 0.55, p))
      outPos.x = lerp(-3 * motion, 0, smoothstep(0, 0.6, p))
      break
    }
    case 'swiflo': {
      // travel beside the value packet
      const lx = swifloX(p)
      outLook.set(lx + 1.8 * motion, 0.2, 0)
      outPos.set(lx - 2.4 * motion, 1.7, 9 + (1 - motion) * 4)
      break
    }
  }
}

export function updateCamera(camera: PerspectiveCamera, dt: number, aspect: number) {
  pose(driver.keyIndexA, tmpA, tmpLook)
  const lookA = tmpLook.clone()
  const posA = tmpA.clone()
  pose(driver.keyIndexB, tmpB, tmpLook)
  const t = store.t
  const pos = posA.lerp(tmpB, t)
  const look = lookA.lerp(tmpLook, t)

  // narrow viewports see less of the world: pull the camera back
  const back = clamp(1.55 / Math.max(aspect, 0.3), 1, 2.2)
  pos.sub(look).multiplyScalar(store.mobile ? Math.min(back, 1.9) : 1).add(look)

  // gentle pointer parallax
  if (!store.reduced && !store.mobile) {
    pos.x += store.pointer.nx * 0.45
    pos.y += store.pointer.ny * 0.3
  }

  if (!primed) {
    smoothPos.copy(pos)
    smoothLook.copy(look)
    primed = true
  }
  const damp = store.reduced ? 1 : 1 - Math.pow(0.004, dt)
  smoothPos.lerp(pos, damp)
  smoothLook.lerp(look, damp)
  camera.position.copy(smoothPos)
  camera.lookAt(smoothLook)

  const ka = sectionKeys[driver.keyIndexA]
  const kb = sectionKeys[driver.keyIndexB]
  view.calm = lerp(ka.calm, kb.calm, t)
  view.shift = store.mobile ? 0 : lerp(ka.shift, kb.shift, t) * clamp(aspect / 1.7, 0.5, 1.2)
  view.scale = store.mobile ? clamp(aspect / 1.1, 0.5, 1) : 1
}
