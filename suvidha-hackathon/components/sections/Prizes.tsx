import SectionHeading from "@/components/ui/SectionHeading";
import CornerBrackets from "@/components/ui/CornerBrackets";
import Diamond from "@/components/ui/Diamond";
import { PRIZES, PRIZE_POOL_NOTE } from "@/lib/site";

export default function Prizes() {
  return (
    <section id="prizes" className="relative px-4 py-32 sm:px-6">
      {/* midnight backdrop panel ties the section to the foundation's navy */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent via-midnight/15 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Spoils"
          title="Prizes"
          subtitle={PRIZE_POOL_NOTE}
        />

        <div className="grid gap-8 md:grid-cols-3">
          {PRIZES.map((prize, i) => (
            <article
              key={prize.numeral}
              className={`group stepped-corners relative flex flex-col items-center border border-gold/30 bg-charcoal px-8 pb-10 pt-14 text-center transition-all duration-500 hover:-translate-y-2 hover:border-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] ${
                i === 0 ? "md:-translate-y-4 md:hover:-translate-y-6" : ""
              }`}
            >
              <CornerBrackets />
              <Diamond sizeClass="size-20">
                <span className="font-display text-3xl text-gold">
                  {prize.numeral}
                </span>
              </Diamond>
              <h3 className="mt-9 font-display text-xl uppercase tracking-widest text-cream">
                {prize.place}
              </h3>
              <div
                aria-hidden="true"
                className="mt-5 h-px w-16 bg-linear-to-r from-transparent via-gold/60 to-transparent"
              />
              <p className="mt-5 font-display text-4xl text-gold [text-shadow:0_0_20px_rgba(212,175,55,0.3)]">
                {prize.amount}
              </p>
              <p className="mt-4 font-body text-base leading-relaxed text-pewter">
                {prize.details}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center font-body text-sm uppercase tracking-[0.2em] text-pewter">
          Prize amounts are provisional — final breakdown announced with
          registration
        </p>
      </div>
    </section>
  );
}
