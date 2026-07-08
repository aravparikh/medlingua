"use client";

import { useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { FAQS } from "@/lib/site";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-4 py-32 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Enquiries"
          title="Questions & Answers"
          subtitle="Everything students and parents ask before joining."
        />

        <div className="border-t border-gold/25">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.question} className="border-b border-gold/25">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center gap-5 p-6 text-left transition-colors duration-300 hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
                  >
                    <span
                      aria-hidden="true"
                      className="w-8 shrink-0 font-display text-xl text-gold/70"
                    >
                      {ROMAN[i]}
                    </span>
                    <span className="grow font-body text-lg font-semibold text-cream">
                      {faq.question}
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className={`size-4 shrink-0 fill-none stroke-gold stroke-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M2 5l6 6 6-6" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-button-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-7 pl-19 font-body text-lg leading-relaxed text-pewter">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
