'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

type ThermalMagnifierProps = {
  /** Ordinary photo, shown everywhere outside the lens. */
  baseSrc: string
  /** Infrared photo of the same framing, revealed inside the lens. */
  thermalSrc: string
  alt: string
  /** Intrinsic size of the pair, used for the frame's aspect ratio. */
  width: number
  height: number
  /** Lens radius in CSS pixels. */
  radius?: number
}

/**
 * Shows `baseSrc` with a circular "magnifying glass" of `thermalSrc` following
 * the pointer. Both images are stacked in the same box and the top one is
 * clipped to a circle, so the two views stay in register at any size.
 */
export default function ThermalMagnifier({
  baseSrc,
  thermalSrc,
  alt,
  width,
  height,
  radius = 130,
}: ThermalMagnifierProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pointRef = useRef<{ x: number; y: number } | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const [lensOpen, setLensOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Pointer moves fire far more often than the display refreshes, so the
  // position is written straight to CSS variables once per frame instead of
  // re-rendering the component on every event.
  const writePoint = useCallback(() => {
    frameRequestRef.current = null
    const frame = frameRef.current
    const point = pointRef.current
    if (!frame || !point) return
    frame.style.setProperty('--lens-x', `${point.x}px`)
    frame.style.setProperty('--lens-y', `${point.y}px`)
  }, [])

  const trackPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current
    if (!frame) return
    const bounds = frame.getBoundingClientRect()
    pointRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
    frameRequestRef.current ??= requestAnimationFrame(writePoint)
  }, [writePoint])

  const openLens = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    trackPointer(event)
    writePoint() // place the lens before it grows, so it does not fly in
    setLensOpen(true)
  }, [trackPointer, writePoint])

  const closeLens = useCallback(() => setLensOpen(false), [])

  useEffect(() => () => {
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current)
    }
  }, [])

  const lensRadius = showAll ? 0 : lensOpen ? radius : 0

  return (
    <figure className="m-0 flex w-full flex-col gap-4">
      <div
        ref={frameRef}
        onPointerEnter={openLens}
        onPointerMove={trackPointer}
        onPointerLeave={closeLens}
        onPointerCancel={closeLens}
        style={{ aspectRatio: `${width} / ${height}`, '--lens-r': `${lensRadius}px` } as React.CSSProperties}
        className="thermal-frame relative w-full cursor-crosshair overflow-hidden rounded-xl bg-zinc-200 select-none dark:bg-zinc-800"
      >
        <Image
          src={baseSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          draggable={false}
          loading="eager"
          fetchPriority="high"
        />
        <div
          aria-hidden
          className={`thermal-lens absolute inset-0 ${showAll ? 'thermal-lens--all' : ''}`}
        >
          <Image
            src={thermalSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            draggable={false}
            loading="eager"
          />
        </div>
        <div aria-hidden className="thermal-ring" />
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span>Move your pointer over the photo to look through the thermal lens.</span>
        <button
          type="button"
          onClick={() => setShowAll((on) => !on)}
          aria-pressed={showAll}
          className="rounded-full border border-zinc-300 px-3 py-1 font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {showAll ? 'Show normal view' : 'Show full thermal'}
        </button>
      </figcaption>
    </figure>
  )
}
