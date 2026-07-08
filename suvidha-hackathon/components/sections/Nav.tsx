"use client";

import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import { NAV_LINKS, REGISTRATION_URL } from "@/lib/site";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gold/25 bg-obsidian/90 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <a
          href="#top"
          aria-label="Suvidha International Hackathon — back to top"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian"
        >
          <BrandMark />
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-cream transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:text-gold focus-visible:underline focus-visible:underline-offset-8"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={REGISTRATION_URL ?? "#register"}
              className="inline-flex h-11 items-center border-2 border-gold px-6 font-body text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold hover:text-obsidian hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian"
              {...(REGISTRATION_URL
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              Register
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex size-11 items-center justify-center border border-gold/50 text-gold md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-full bg-gold transition-transform duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-full bg-gold transition-opacity duration-300 ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute left-0 top-3 h-0.5 w-full bg-gold transition-transform duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-gold/25 bg-obsidian md:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-gold/10 py-4 font-body text-sm font-semibold uppercase tracking-[0.2em] text-cream transition-colors hover:text-gold"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={REGISTRATION_URL ?? "#register"}
                onClick={() => setOpen(false)}
                className="mt-4 flex h-12 items-center justify-center border-2 border-gold font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold"
                {...(REGISTRATION_URL
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                Register
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
