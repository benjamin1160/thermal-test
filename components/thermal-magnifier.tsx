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
  /**
   * Largest lens radius in CSS pixels. The lens is also capped at a share of
   * the frame's short side, so it stays a beam on a phone instead of swallowing
   * the whole photo.
   */
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

/** Share of the frame's short side the lens may cover, and its floor in px. */
const LENS_SHARE = 0.32
const MIN_RADIUS = 44

/**
 * A finger sits on top of the very thing the lens is revealing, so on touch the
 * beam is lifted this far above the contact point — about the same trick the
 * text loupe uses. Mice have no such problem and get no offset.
 */
const TOUCH_LIFT = 56

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Shows `baseSrc` with a circular "flashlight" of the thermal view that follows
 * the pointer — hover on a mouse, drag on a touchscreen. Both layers are
 * stacked in the same box and the top one is clipped to a circle, so the two
 * views stay in register at any size.
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
  /** Pointer id of the finger currently dragging, so a second one is ignored. */
  const touchIdRef = useRef<number | null>(null)
  const [lensOpen, setLensOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(null)

  // useId can contain characters that are not valid in a CSS url() reference.
  const filterId = `thermal-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // The frame is fluid, so a radius fixed in CSS pixels that reads as a lens on
  // a laptop covers a phone-sized photo end to end. Scale it with the box.
  const shortSide = frameSize ? Math.min(frameSize.w, frameSize.h) : 0
  const lensRadius = shortSide
    ? clamp(shortSide * LENS_SHARE, Math.min(MIN_RADIUS, shortSide / 2), radius)
    : radius

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setFrameSize((previous) =>
        previous && previous.w === w && previous.h === h ? previous : { w, h },
      )
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

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

  const trackPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const frame = frameRef.current
      if (!frame) return
      const bounds = frame.getBoundingClientRect()
      const lift = event.pointerType === 'mouse' ? 0 : Math.min(TOUCH_LIFT, lensRadius)
      // Clamped so a finger that slides off the edge keeps the beam on the
      // photo rather than parking it half outside.
      pointRef.current = {
        x: clamp(event.clientX - bounds.left, 0, bounds.width),
        y: clamp(event.clientY - bounds.top - lift, 0, bounds.height),
      }
      frameRequestRef.current ??= requestAnimationFrame(writePoint)
    },
    [lensRadius, writePoint],
  )

  /** Places the lens before it grows, so it does not fly in from elsewhere. */
  const placeLens = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      trackPointer(event)
      writePoint()
      setLensOpen(true)
    },
    [trackPointer, writePoint],
  )

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Touch fires enter alongside down; the press handler owns that case.
      if (event.pointerType !== 'mouse') return
      placeLens(event)
    },
    [placeLens],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') return
      if (touchIdRef.current !== null) return
      touchIdRef.current = event.pointerId
      // Capture keeps the beam tracking even once the finger leaves the frame.
      event.currentTarget.setPointerCapture(event.pointerId)
      placeLens(event)
    },
    [placeLens],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' && touchIdRef.current !== event.pointerId) return
      trackPointer(event)
    },
    [trackPointer],
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== event.pointerId) return
    touchIdRef.current = null
    setLensOpen(false)
  }, [])

  const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // A captured finger reports leave as soon as it crosses the edge, but it is
    // still driving the beam; only a mouse actually leaving closes the lens.
    if (event.pointerType !== 'mouse') return
    setLensOpen(false)
  }, [])

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
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        // Long-pressing a photo otherwise offers to save or share it, which
        // interrupts the drag the moment the beam gets interesting.
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        style={{
          aspectRatio: `${width} / ${height}`,
          '--lens-r': `${lensOpen && !showAll ? lensRadius : 0}px`,
        } as React.CSSProperties}
        className="thermal-frame relative w-full cursor-crosshair overflow-hidden rounded-xl bg-zinc-200 select-none dark:bg-zinc-800"
      >
        {/* The images take no hits, so the frame is what a long press lands on
            and the browser has no image to offer up. */}
        <Image
          src={baseSrc}
          alt={alt}
          fill
          sizes={sizes}
          className="pointer-events-none object-cover"
          draggable={false}
          loading="eager"
          fetchPriority="high"
        />
        <div
          aria-hidden
          className={`thermal-lens pointer-events-none absolute inset-0 ${showAll ? 'thermal-lens--all' : ''}`}
        >
          <Image
            src={thermalSrc ?? baseSrc}
            alt=""
            fill
            sizes={sizes}
            className="pointer-events-none object-cover"
            draggable={false}
            loading="eager"
            style={thermalSrc ? undefined : { filter: `url(#${filterId})` }}
          />
        </div>
        <div aria-hidden className="thermal-ring" />
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span>Drag a finger — or move your pointer — to shine the thermal light.</span>
        <button
          type="button"
          onClick={() => setShowAll((on) => !on)}
          aria-pressed={showAll}
          className="touch-manipulation rounded-full border border-zinc-300 px-3 py-1 font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {showAll ? 'Show normal view' : 'Show full thermal'}
        </button>
      </figcaption>
    </figure>
  )
}
