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

`components/thermal-magnifier.tsx` renders a normal photo with a circular lens
that follows the pointer and reveals an infrared photo of the same scene
underneath it.

```tsx
<ThermalMagnifier
  baseSrc="/room.png"
  thermalSrc="/room-thermal.png"
  alt="Open-plan kitchen and living room"
  width={1200}
  height={800}
  radius={130}
/>
```

Both images are stacked in the same box with `object-cover`, and the top one is
clipped with `clip-path: circle(...)`, so the two views stay in register at any
size. The lens centre is written to CSS custom variables once per animation
frame, so pointer movement never re-renders the component.

### Using your own photos

Replace `public/room.png` and `public/room-thermal.png` with your pair, then
update the `src` props and `width`/`height` in `app/page.tsx`. The two shots
should be framed identically and share an aspect ratio — anything else and the
lens will not line up with what surrounds it.

The images currently in `public/` are synthetic placeholders. Regenerate them
from the repository root with:

```bash
python3 scripts/make-placeholders.py
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
