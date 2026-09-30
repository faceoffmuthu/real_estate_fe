import { useEffect, useState } from 'react'
import { formatNumber } from '../../utils/format'

/** Animates an integer KPI with an isolated requestAnimationFrame loop. */
export function AnimatedCounter({ value, duration = 900 }: { value: number; duration?: number }) {
  const target = Number.isFinite(value) ? value : 0
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setCurrent(target)
      return
    }
    let frame = 0
    let startedAt = 0
    const tick = (now: number) => {
      if (!startedAt) startedAt = now
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(progress === 1 ? target : Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return <span aria-label={formatNumber(target)} aria-live="off">{formatNumber(current)}</span>
}
