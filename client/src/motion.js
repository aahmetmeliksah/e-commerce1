import { animate } from 'motion'
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
let scrolling
let cleanupScrolling = () => {}
export function stopScrolling() {
  scrolling?.stop()
  cleanupScrolling()
  scrolling = undefined
}
export function scrollToSection(selector) {
  stopScrolling()
  const target = document.querySelector(selector)
  if (!target) return
  target.focus({ preventScroll: true })
  const start = window.scrollY
  const end =
    selector === '#main'
      ? 0
      : Math.max(0, target.getBoundingClientRect().top + start - 24)
  const cleanup = () => {
    window.removeEventListener('wheel', interrupt)
    window.removeEventListener('touchstart', interrupt)
    window.removeEventListener('keydown', keyboardInterrupt)
  }
  const interrupt = () => stopScrolling()
  const keyboardInterrupt = (event) => {
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        ' ',
      ].includes(event.key)
    )
      stopScrolling()
  }
  cleanupScrolling = cleanup
  const finish = () => {
    cleanup()
    target.focus({ preventScroll: true })
  }
  if (reducedMotion()) {
    window.scrollTo({ top: end, behavior: 'instant' })
    finish()
    return
  }
  window.addEventListener('wheel', interrupt, { passive: true })
  window.addEventListener('touchstart', interrupt, { passive: true })
  window.addEventListener('keydown', keyboardInterrupt)
  scrolling = animate(start, end, {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (value) => window.scrollTo({ top: value, behavior: 'instant' }),
    onComplete: finish,
  })
}
export function revealDialog(element) {
  return animate(
    element,
    { opacity: [0, 1], y: [20, 0], scale: [0.97, 1] },
    { duration: reducedMotion() ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }
  )
}
export function hideDialog(element) {
  return animate(
    element,
    { opacity: 0, y: 12, scale: 0.98 },
    { duration: reducedMotion() ? 0 : 0.18 }
  )
}
