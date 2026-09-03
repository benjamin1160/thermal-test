'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type ThermalMagnifierProps = {
  /** Ordinary photo, shown everywhere outside the lens. */
  baseSrc: string
  /**
   * Infrared photo of the same framing, revealed inside the lens. Omit it and
   * the thermal view is derived from `baseSrc` by the false-colour filter
   * below, which needs no second file and works with any photo.
   */
  thermalSrc?: string
  alt: string
  /** Intrinsic size of the photo, used for the frame's aspect ratio. */
  width: number
  height: number
  /** Lens radius in CSS pixels. */
  radius?: number
}

/**
 * Cold-to-hot false-colour ramp, sampled at even intervals.
 * `feComponentTransfer` interpolates between the entries, which is exactly a
 * colour lookup table over the image's luminance.
 */
const RAMP = {
  r: [0.11, 0.09, 0.1, 0.46, 0.96, 0.98, 0.91],
  g: [0.03, 0.29, 0.69, 0.84, 0.83, 0.54, 0.21],
  b: [0.38, 0.82, 0.81, 0.36, 0.24, 0.16, 0.15],
}

/**
 * Shows `baseSrc` with a circular "magnifying glass" of the thermal view
 * following the pointer. Both layers are stacked in the same box and the top
 * one is clipped to a circle, so the two views stay in register at any size.
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

  // useId can contain characters that are not valid in a CSS url() reference.
  const filterId = `thermal-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

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

  const sizes = '(max-width: 768px) 100vw, 768px'

  return (
    <figure className="m-0 flex w-full flex-col gap-4">
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Infrared sensors resolve far less detail than a camera. */}
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix type="saturate" values="0" />
          {/* Interiors are bright almost everywhere, so a straight luminance
              reading would peg the whole room at the hot end of the ramp. The
              gamma curve pushes mid-tones down into the greens and leaves the
              top of the range for genuine highlights. */}
          <feComponentTransfer>
            <feFuncR type="gamma" exponent="2.8" offset="0.02" />
            <feFuncG type="gamma" exponent="2.8" offset="0.02" />
            <feFuncB type="gamma" exponent="2.8" offset="0.02" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="table" tableValues={RAMP.r.join(' ')} />
            <feFuncG type="table" tableValues={RAMP.g.join(' ')} />
            <feFuncB type="table" tableValues={RAMP.b.join(' ')} />
          </feComponentTransfer>
        </filter>
      </svg>

      <div
        ref={frameRef}
        onPointerEnter={openLens}
        onPointerMove={trackPointer}
        onPointerLeave={closeLens}
        onPointerCancel={closeLens}
        style={{
          aspectRatio: `${width} / ${height}`,
          '--lens-r': `${lensOpen && !showAll ? radius : 0}px`,
        } as React.CSSProperties}
        className="thermal-frame relative w-full cursor-crosshair overflow-hidden rounded-xl bg-zinc-200 select-none dark:bg-zinc-800"
      >
        <Image
          src={baseSrc}
          alt={alt}
          fill
          sizes={sizes}
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
            src={thermalSrc ?? baseSrc}
            alt=""
            fill
            sizes={sizes}
            className="object-cover"
            draggable={false}
            loading="eager"
            style={thermalSrc ? undefined : { filter: `url(#${filterId})` }}
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
