import ThermalMagnifier from '@/components/thermal-magnifier'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Thermal magnifying glass
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A circular lens follows the pointer and reveals the infrared version
            of the same shot underneath it.
          </p>
        </header>

        <ThermalMagnifier
          baseSrc="/room.jpg"
          alt="Open-plan kitchen and living room"
          width={1600}
          height={1088}
          radius={130}
        />

        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-500">
          The thermal view here is derived from the photo itself. Pass a{' '}
          <code className="font-mono">thermalSrc</code> to use a real infrared
          shot instead — see the README.
        </p>
      </main>
    </div>
  )
}
