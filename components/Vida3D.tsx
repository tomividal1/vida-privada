"use client";

export default function Vida3D() {
  return (
    <section className="relative mb-8 h-[420px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
      <div className="pointer-events-none absolute left-6 top-6 z-10">
        <p className="text-xs font-medium tracking-[0.3em] text-zinc-600">
          VIDA PRIVADA
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Tu centro de control
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Todo lo importante, en un solo lugar.
        </p>
      </div>

      <iframe
        src="https://my.spline.design/particleaibrain-VzKtdsFnlyA3AMe44kuwnAAS/"
        frameBorder="0"
        width="100%"
        height="100%"
        allowFullScreen
        className="relative z-0 h-full w-full"
      />
    </section>
  );
}