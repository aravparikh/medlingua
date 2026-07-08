import BrandMark from "@/components/ui/BrandMark";
import { EVENT, HOSTS, NAV_LINKS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-gold/25 px-4 pb-10 pt-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandMark />
          <p className="mt-6 max-w-sm font-body text-base leading-relaxed text-pewter">
            The Suvidha International Hackathon is organized by{" "}
            {EVENT.organizer} — opening doors to technology for the next
            generation of builders.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            Navigate
          </h3>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-body text-base text-cream/80 transition-colors duration-300 hover:text-gold"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#register"
                className="font-body text-base text-cream/80 transition-colors duration-300 hover:text-gold"
              >
                Register
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            Hosts
          </h3>
          <ul className="mt-5 space-y-3">
            {HOSTS.map((host) => (
              <li key={host.name} className="font-body text-base text-cream/80">
                {host.name}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-display text-sm uppercase tracking-[0.25em] text-gold">
            Contact
          </h3>
          <p className="mt-4 font-body text-base text-cream/80">
            {/* placeholder — replace in lib/site.ts */}
            {EVENT.contactEmail}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl border-t border-gold/15 pt-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-6 flex items-center justify-center gap-4"
        >
          <span className="h-px w-10 bg-gold/30" />
          <span className="size-1.5 rotate-45 bg-gold/50" />
          <span className="h-px w-10 bg-gold/30" />
        </div>
        <p className="font-body text-sm uppercase tracking-[0.2em] text-pewter">
          © {new Date().getFullYear()} {EVENT.organizer}
        </p>
      </div>
    </footer>
  );
}
