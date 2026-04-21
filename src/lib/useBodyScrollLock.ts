import { useEffect } from 'react'

// Ref-counted so overlapping drawers don't fight over the body style.
let lockCount = 0
let prevOverflow = ''
let prevPaddingRight = ''

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    if (lockCount === 0) {
      // Compensate for the disappearing scrollbar so layout doesn't jump
      // on platforms that render gutter scrollbars (Windows, Linux).
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth
      prevOverflow = document.body.style.overflow
      prevPaddingRight = document.body.style.paddingRight
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }
    lockCount++
    return () => {
      lockCount--
      if (lockCount === 0) {
        document.body.style.overflow = prevOverflow
        document.body.style.paddingRight = prevPaddingRight
      }
    }
  }, [active])
}
