import SectionHeading from "@/components/ui/SectionHeading";
import CornerBrackets from "@/components/ui/CornerBrackets";
import Diamond from "@/components/ui/Diamond";
import { JUDGES } from "@/lib/site";

/**
 * When JUDGES (lib/site.ts) is empty, renders an elegant "to be announced"
 * empty state. Add judges to the array and the same grid renders their
 * cards — no redesign needed.
 */
export default function Judges() {
  return (
    <section id="judges" className="relative px-4 py-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Panel"
          title="Judges"
          subtitle="An esteemed panel is being assembled to review every submission."
        />

        {JUDGES.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {JUDGES.map((judge) => (
              <article
                key={judge.name}
                className="group relative flex flex-col items-center border border-gold/30 bg-charcoal p-10 text-center transition-all duration-500 hover:-translate-y-2 hover:border-gold"
              >
                <CornerBrackets />
                <Diamond sizeClass="size-24">
                  {judge.photo ? (
                    // double-frame treatment: gold diamond outer, dark inner
                    <span className="block size-[70%] overflow-hidden border-2 border-obsidian">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={judge.photo}
                        alt=""
                        className="size-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                      />
                    </span>
                  ) : (
                    <span className="font-display text-2xl text-gold">
                      {judge.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  )}
                </Diamond>
                <h3 className="mt-9 font-display text-xl uppercase tracking-widest text-cream">
                  {judge.name}
                </h3>
                <p className="mt-2 font-body text-sm uppercase tracking-[0.2em] text-pewter">
                  {judge.title}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="group stepped-corners relative mx-auto max-w-3xl border border-gold/30 bg-charcoal px-8 py-16 text-center sm:px-16">
            <CornerBrackets />
            <Diamond sizeClass="size-20" className="mx-auto">
              <span
                aria-hidden="true"
                className="font-display text-3xl text-gold"
              >
                ?
              </span>
            </Diamond>
            <h3 className="mt-10 font-display text-2xl uppercase tracking-widest text-gold sm:text-3xl">
              Judges to be announced
            </h3>
            <p className="mx-auto mt-5 max-w-md font-body text-lg leading-relaxed text-cream/75">
              Distinguished names are on their way. Watch this space — the
              panel will be revealed before registration closes.
            </p>
            <div
              aria-hidden="true"
              className="mx-auto mt-8 flex items-center justify-center gap-4"
            >
              <span className="h-px w-10 bg-gold/40" />
              <span className="size-1.5 rotate-45 bg-gold/60" />
              <span className="h-px w-10 bg-gold/40" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
