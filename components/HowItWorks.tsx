const steps = [
  {
    number: "01",
    titleEN: "Speak or snap",
    titleES: "Habla o fotografía",
    body: "Talk directly or photograph a prescription label. MedLingua picks up handwritten shorthand, pill bottle text, and spoken instructions.",
  },
  {
    number: "02",
    titleEN: "Precision translation",
    titleES: "Traducción de precisión",
    body: "GPT-4o translates using a clinical medical glossary, so PO (by mouth), BID (twice daily), PRN (as needed), drug names, and exact doses survive the translation intact.",
  },
  {
    number: "03",
    titleEN: "Hear and read it",
    titleES: "Escucha y léelo",
    body: "The result is spoken aloud in large type — and a bilingual visit summary is auto-generated so the patient leaves with a written record in both languages.",
  },
];

import TwoVoices from "./TwoVoices";

export default function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      style={{
        backgroundColor: "var(--teal-tint)",
        padding: "5rem 1.25rem",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <TwoVoices width={260} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--teal)",
              marginBottom: "0.75rem",
            }}
          >
            How it works
          </p>
          <h2
            id="how-heading"
            style={{ fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)" }}
          >
            Three steps. Any phone. Any clinic.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                backgroundColor: "var(--white)",
                borderRadius: "16px",
                padding: "2rem",
                boxShadow: "0 4px 24px rgba(15,61,56,0.07)",
                transition: "transform 200ms ease-out, box-shadow 200ms ease-out",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(15,61,56,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(15,61,56,0.07)";
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-heading, sans-serif)",
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: "var(--teal)",
                  lineHeight: 1,
                  marginBottom: "1rem",
                  opacity: 0.35,
                }}
                aria-hidden="true"
              >
                {step.number}
              </p>
              <h3
                style={{
                  fontSize: "1.1875rem",
                  marginBottom: "0.25rem",
                  color: "var(--deep-teal)",
                }}
              >
                {step.titleEN}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--teal)",
                  fontStyle: "italic",
                  marginBottom: "0.875rem",
                  fontFamily: "var(--font-heading, sans-serif)",
                }}
              >
                {step.titleES}
              </p>
              <p style={{ color: "var(--grey)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
