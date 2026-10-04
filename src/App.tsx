import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { initStringTune, destroyStringTune } from './animation/stringtune'
import { initReveals } from './animation/reveal'
import { startDriver } from './lib/scrollDriver'
import { store } from './lib/store'
import { hasWebGL, useReducedMotion } from './hooks/useEnv'
import { projects } from './data/projects'
import { Navigation } from './components/Navigation'
import { IndexOverlay } from './components/IndexOverlay'
import { Cursor } from './components/Cursor'
import { Hero } from './components/Hero'
import { Achievements, Intro, WorkDivider } from './components/Sections'
import { ProjectSection } from './components/ProjectSection'
import { Stack } from './components/Stack'
import { Architecture } from './components/Architecture'
import { About, Contact } from './components/AboutContact'

// The 3D world is progressive enhancement: loaded lazily, and the page works without it.
const World = lazy(() => import('./webgl/World'))

export default function App() {
  const reduced = useReducedMotion()
  const [indexOpen, setIndexOpen] = useState(false)
  const [gl, setGl] = useState<boolean>(() => hasWebGL())
  const closeIndex = useCallback(() => setIndexOpen(false), [])

  useEffect(() => {
    store.reduced = reduced
  }, [reduced])

  // scroll engine, reveals, scene driver
  useEffect(() => {
    const root = document.documentElement
    store.reduced = reduced
    store.mobile = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
    root.classList.add('js-reveal')
    initStringTune(reduced)
    const stopReveals = initReveals(reduced)
    const stopDriver = startDriver()
    return () => {
      stopReveals()
      stopDriver()
      destroyStringTune()
      root.classList.remove('js-reveal')
    }
  }, [reduced])

  useEffect(() => {
    if (!gl) document.documentElement.classList.add('no-webgl')
  }, [gl])

  // pointer (fine pointers only) -> shared store used by camera + nodes
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      store.pointer.x = e.clientX
      store.pointer.y = e.clientY
      store.pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
      store.pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <>
      <a href="#hero" className="skip">
        Skip to content
      </a>
      {gl && (
        <Suspense fallback={null}>
          <World onFail={() => setGl(false)} />
        </Suspense>
      )}
      <div className="veil" aria-hidden="true" />
      <Navigation onOpenIndex={() => setIndexOpen(true)} />
      <IndexOverlay open={indexOpen} onClose={closeIndex} />
      <main>
        <Hero />
        <Intro />
        <Achievements />
        <WorkDivider />
        {projects.map((p, i) => (
          <ProjectSection key={p.id} project={p} index={i} />
        ))}
        <Stack />
        <Architecture />
        <About />
        <Contact />
      </main>
      <Cursor />
    </>
  )
}
