import { animate, stagger, splitText } from 'animejs'

/**
 * Anime.js (v4) choreography: headings split into masked characters, metadata fades in.
 * - [data-split]  : characters rise through a clipped word mask
 * - [data-fade]   : short translate + opacity entrance (optional data-delay in ms)
 * With reduced motion everything is shown immediately, content unchanged.
 */
const EASE = 'outExpo'

export function initReveals(reduced: boolean) {
  const targets = document.querySelectorAll<HTMLElement>('[data-split]')
  const fades = document.querySelectorAll<HTMLElement>('[data-fade]')

  if (reduced) {
    targets.forEach((el) => (el.style.visibility = 'visible'))
    fades.forEach((el) => (el.style.opacity = '1'))
    return () => {}
  }

  const splits: { revert: () => unknown }[] = []
  const prepared = new Map<Element, ReturnType<typeof splitText>>()

  targets.forEach((el) => {
    const s = splitText(el, { words: { wrap: 'clip', class: 'w' }, chars: true })
    prepared.set(el, s)
    splits.push(s)
    s.chars.forEach((c: HTMLElement) => {
      c.style.transform = 'translateY(105%)'
    })
    el.style.visibility = 'visible'
  })
  fades.forEach((el) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(14px)'
  })

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        io.unobserve(el)
        const split = prepared.get(el)
        if (split) {
          const delay = Number(el.dataset.delay ?? 0)
          animate(split.chars, {
            translateY: ['105%', '0%'],
            duration: 1100,
            delay: stagger(16, { start: delay }),
            ease: EASE,
          })
        } else {
          const delay = Number(el.dataset.delay ?? 0)
          animate(el, { opacity: [0, 1], translateY: [14, 0], duration: 900, delay, ease: EASE })
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.15 },
  )
  targets.forEach((el) => io.observe(el))
  fades.forEach((el) => io.observe(el))

  return () => {
    io.disconnect()
    splits.forEach((s) => s.revert())
  }
}
