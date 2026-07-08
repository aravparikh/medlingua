import RegisterButton from "@/components/ui/RegisterButton";
import DecoButton from "@/components/ui/DecoButton";
import { EVENT } from "@/lib/site";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 pt-20 sm:px-6"
    >
      {/* sunburst rays + golden halo behind the title */}
      <div aria-hidden="true" className="sunburst absolute inset-0" />
      <div aria-hidden="true" className="deco-halo absolute inset-0" />

      {/* flanking architectural verticals */}
      <div
        aria-hidden="true"
        className="absolute inset-y-24 left-6 hidden w-px bg-linear-to-b from-transparent via-gold/30 to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-24 right-6 hidden w-px bg-linear-to-b from-transparent via-gold/30 to-transparent lg:block"
      />

      <div className="relative mx-auto max-w-5xl py-24 text-center">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-gold/80 sm:text-sm">
          {EVENT.organizer} presents
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-8 flex items-center justify-center gap-4"
        >
          <span className="h-px w-12 bg-gold/60 sm:w-20" />
          <span className="size-2.5 rotate-45 border border-gold" />
          <span className="h-px w-12 bg-gold/60 sm:w-20" />
        </div>

        {/* clamp keeps the long "International" line inside narrow phones */}
        <h1 className="mt-8 font-display text-[clamp(1.9rem,8vw,4.5rem)] uppercase leading-tight tracking-widest text-cream">
          Suvidha
          <span className="mt-2 block text-gold [text-shadow:0_0_30px_rgba(212,175,55,0.35)]">
            International
          </span>
          <span className="mt-2 block">Hackathon</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl font-body text-lg leading-relaxed text-cream/85 sm:text-xl">
          {EVENT.tagline}
        </p>

        {/* event facts strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-body text-sm uppercase tracking-[0.18em] text-pewter">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
            {EVENT.dateLabel}
          </span>
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
            {EVENT.format}
          </span>
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
            100% free
          </span>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <RegisterButton />
          <DecoButton href="#about">Discover More</DecoButton>
        </div>

        <p className="mt-6 font-body text-base text-gold-light/90">
          {EVENT.eligibility}
        </p>
      </div>

      {/* stepped base line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 flex justify-center"
      >
        <div className="h-px w-full max-w-6xl bg-linear-to-r from-transparent via-gold/40 to-transparent" />
      </div>
    </section>
  );
}
