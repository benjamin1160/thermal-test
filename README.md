This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Thermal magnifying glass

`components/thermal-magnifier.tsx` renders a photo with a circular lens that
follows the pointer and reveals a thermal view of the same scene underneath it.
On a touchscreen it works like a flashlight: the beam appears under the finger
that presses the photo, tracks it, and goes out when the finger lifts.

```tsx
<ThermalMagnifier
  baseSrc="/kitchen.webp"
  thermalSrc="/kitchen-thermal.webp"
  alt="Open-plan kitchen with an island, pendant lights and a dining area"
  width={2000}
  height={1334}
  radius={130}
/>
```

Both layers are stacked in the same box with `object-cover`, and the top one is
clipped with `clip-path: circle(...)`, so the two views stay in register at any
size. The lens centre is written to CSS custom properties once per animation
frame, so pointer movement never re-renders the component.

### On touch

`radius` is the *largest* lens, not the only one. The frame is fluid, so a
radius that reads as a lens on a laptop is wider than the whole photo on a
phone — the component measures the frame and caps the lens at 32% of its short
side, which is why the prop above still behaves on a 342px-wide screen.

The rest is what a finger needs that a mouse does not:

- `touch-action: none` on the frame, so a sweep drives the beam instead of
  being claimed as a page scroll half way through.
- `-webkit-touch-callout: none`, `pointer-events: none` on both `<Image>`s, and
  a suppressed `contextmenu`, so a long press does not offer to save the photo.
  The images take no hits, so the press lands on the frame and the browser has
  no image to act on.
- The beam is lifted `TOUCH_LIFT` px above the contact point, the same trick the
  text loupe uses, because a finger otherwise covers what it is revealing.
- The frame captures the pointer, and the centre is clamped to the frame, so a
  finger that runs off the edge keeps the beam on the photo instead of dragging
  it half outside.

### Swapping the photos

Replace `public/kitchen.webp` and `public/kitchen-thermal.webp`, then update the
`src` props and `width`/`height`. The two shots must be framed identically and
share an aspect ratio, or the lens will not line up with what surrounds it.

### Without an infrared photo

Omit `thermalSrc` and the thermal view is generated from `baseSrc` by an inline
SVG filter: a slight blur (infrared sensors resolve far less detail than a
camera), a desaturate to luminance, a gamma curve, then an
`feComponentTransfer` colour lookup table holding a cold-to-hot ramp.

That fallback is a stylised effect, not measurement — it maps how *bright* a
surface is, not how warm. A sunlit window reads hot even though it is usually
the coldest part of a wall in winter. Supply a real infrared photo for anything
that has to be true.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
