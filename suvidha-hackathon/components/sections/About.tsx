import SectionHeading from "@/components/ui/SectionHeading";
import CornerBrackets from "@/components/ui/CornerBrackets";
import Diamond from "@/components/ui/Diamond";
import { EVENT, HOSTS } from "@/lib/site";

const PILLARS = [
  {
    title: "Build Anything",
    copy: "Apps, games, websites, AI experiments — if you can dream it, you can enter it. Ship a project you're proud of in one weekend.",
  },
  {
    title: "For Every Student",
    copy: "Middle and high schoolers from anywhere in the world. First hackathon? Perfect — this event was designed with you in mind.",
  },
  {
    title: "A Mission That Matters",
    copy: `Hosted under ${EVENT.organizer}, the hackathon opens doors to technology for young builders everywhere — at zero cost.`,
  },
];

export default function About() {
  return (
    <section id="about" className="relative px-4 py-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Occasion"
          title="About the Hackathon"
          subtitle="A weekend of invention, imagination, and firsts — no experience required, no fee at the door."
        />

        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative border border-gold/30 bg-charcoal p-8 transition-all duration-500 hover:-translate-y-2 hover:border-gold"
            >
              <CornerBrackets />
              <h3 className="font-display text-2xl uppercase tracking-widest text-gold">
                {pillar.title}
              </h3>
              <div aria-hidden="true" className="mt-4 h-px w-12 bg-gold/40" />
              <p className="mt-5 font-body text-lg leading-relaxed text-cream/80">
                {pillar.copy}
              </p>
            </article>
          ))}
        </div>

        {/* Hosts */}
        <div className="mt-28">
          <SectionHeading
            eyebrow="Your Hosts"
            title="The Organizers"
            subtitle="Three students who believe your first hackathon should feel like a grand opening, not a closed door."
          />
          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {HOSTS.map((host) => (
              <article
                key={host.name}
                className="group flex flex-col items-center text-center"
              >
                <Diamond sizeClass="size-24">
                  <span className="font-display text-2xl tracking-widest text-gold">
                    {host.initials}
                  </span>
                </Diamond>
                <h3 className="mt-10 font-display text-xl uppercase tracking-widest text-cream">
                  {host.name}
                </h3>
                <p className="mt-2 font-body text-sm uppercase tracking-[0.2em] text-pewter">
                  {host.role}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-4 h-px w-10 bg-gold/50 transition-all duration-500 group-hover:w-20 group-hover:bg-gold"
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
