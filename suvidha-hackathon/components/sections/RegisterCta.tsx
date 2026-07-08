import RegisterButton from "@/components/ui/RegisterButton";
import CornerBrackets from "@/components/ui/CornerBrackets";
import { EVENT } from "@/lib/site";

export default function RegisterCta() {
  return (
    <section id="register" className="relative px-4 py-32 sm:px-6">
      <div className="group stepped-corners relative mx-auto max-w-4xl border border-gold/40 bg-charcoal px-6 py-20 text-center sm:px-16">
        <CornerBrackets />
        <div aria-hidden="true" className="deco-halo absolute inset-0" />
        <div className="relative">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-gold/80">
            Your invitation awaits
          </p>
          <h2 className="mt-6 font-display text-4xl uppercase tracking-widest text-cream sm:text-5xl">
            Take Your Seat at the Table
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/80">
            One weekend. Zero cost. A project with your name on it — and up to
            $500 in prizes on the line.
          </p>
          <div className="mt-10 flex justify-center">
            <RegisterButton />
          </div>
          <p className="mt-6 font-body text-base text-gold-light/90">
            {EVENT.eligibility}
          </p>
        </div>
      </div>
    </section>
  );
}
