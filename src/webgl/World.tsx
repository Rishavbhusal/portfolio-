import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Network } from './Network'
import { updateCamera } from './cameraRig'
import { store } from '../lib/store'

class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Camera + adaptive quality. Runs before Network so the view state is current. */
function Rig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const setDpr = useThree((s) => s.setDpr)
  const mon = useRef({ acc: 0, frames: 0, low: 0 })
  useFrame((_, dt) => {
    if (store.hidden) return
    updateCamera(camera as import('three').PerspectiveCamera, Math.min(dt, 0.05), size.width / size.height)
    // adaptive quality: sample average frame time every ~2s
    const m = mon.current
    m.acc += dt
    m.frames++
    if (m.acc > 2) {
      const avg = m.acc / m.frames
      if (avg > 0.028) m.low++
      else m.low = Math.max(0, m.low - 1)
      if (m.low >= 2 && store.quality > 0.5) {
        store.quality = 0.5
        setDpr(1)
      }
      m.acc = 0
      m.frames = 0
    }
  }, -1)
  return null
}

export default function World({ onFail }: { onFail: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const mobile = store.mobile
  const count = mobile ? 280 : 560
  const packets = mobile ? 26 : 64

  return (
    <div className="world" aria-hidden="true">
      <Boundary onError={onFail}>
        <Canvas
          frameloop={visible ? 'always' : 'never'}
          dpr={[1, mobile ? 1.5 : 2]}
          gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 40, near: 0.1, far: 90, position: [0, 0.4, 13] }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              onFail()
            })
          }}
        >
          <Rig />
          <Network count={count} packets={packets} />
        </Canvas>
      </Boundary>
    </div>
  )
}
