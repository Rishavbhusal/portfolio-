import { StringTune, StringMagnetic, StringParallax } from '@fiddle-digital/string-tune'

/**
 * StringTune (v1.x) integration.
 * Verified against the installed typings: StringTune.getInstance(), use(Module),
 * scrollDesktopMode / scrollMobileMode ('smooth' | 'default' | 'disable'),
 * scrollPosition, scrollTo(), start(fps), destroy().
 * - StringParallax drives [string="parallax"] elements (smooth mode only).
 * - StringMagnetic writes --magnetic-x/--magnetic-y CSS vars on [string="magnetic"].
 */
let st: StringTune | null = null
let smooth = false

export function initStringTune(reduced: boolean) {
  if (st) return st
  st = StringTune.getInstance()
  smooth = !reduced
  st.scrollDesktopMode = reduced ? 'default' : 'smooth'
  st.scrollMobileMode = 'default' // native momentum scrolling on touch devices
  st.use(StringParallax)
  st.use(StringMagnetic)
  st.start(60)
  return st
}

export function destroyStringTune() {
  st?.destroy()
  st = null
}

/** Current scroll position in px, from StringTune when it owns scrolling. */
export function getScrollY(): number {
  if (st && smooth && window.innerWidth > 1024 && !window.matchMedia('(pointer: coarse)').matches) {
    return st.scrollPosition
  }
  return window.scrollY
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (st && smooth && window.innerWidth > 1024) {
    st.scrollTo({ element: el, duration: 1800 })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
