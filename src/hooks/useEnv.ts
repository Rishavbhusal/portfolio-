import { useEffect, useState } from 'react'

/** Reactive media-query hook for low-frequency environment changes. */
export function useMedia(query: string, initial = false) {
  const [match, setMatch] = useState(() => (typeof window === 'undefined' ? initial : window.matchMedia(query).matches))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)')

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
