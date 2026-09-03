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

```tsx
<ThermalMagnifier
  baseSrc="/room.jpg"
  alt="Open-plan kitchen and living room"
  width={1600}
  height={1088}
  radius={130}
/>
```

Both layers are stacked in the same box with `object-cover`, and the top one is
clipped with `clip-path: circle(...)`, so the two views stay in register at any
size. The lens centre is written to CSS custom properties once per animation
frame, so pointer movement never re-renders the component.

### Where the thermal view comes from

With only a `baseSrc`, the thermal view is generated from that photo by an
inline SVG filter: a slight blur (infrared sensors resolve far less detail than
a camera), a desaturate to luminance, a gamma curve, then an
`feComponentTransfer` colour lookup table holding a cold-to-hot ramp.

This is a stylised effect, not measurement — it maps how *bright* a surface is,
not how warm. A sunlit window reads hot even though it is usually the coldest
part of a wall in winter. Use it for the visual; use a real infrared photo for
anything that has to be true.

### Using a real infrared photo

Pass `thermalSrc` alongside `baseSrc` and the lens shows that image directly,
with no filter:

```tsx
<ThermalMagnifier
  baseSrc="/room.jpg"
  thermalSrc="/room-thermal.jpg"
  alt="Open-plan kitchen and living room"
  width={1600}
  height={1088}
/>
```

The two shots must be framed identically and share an aspect ratio, or the lens
will not line up with what surrounds it.

Demo photo from [Unsplash](https://unsplash.com/photos/ce8a6c25118c).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
