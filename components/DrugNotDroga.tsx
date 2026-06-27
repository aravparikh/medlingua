export default function DrugNotDroga() {
  return (
    <section
      aria-labelledby="drug-heading"
      style={{
        backgroundColor: "var(--paper)",
        padding: "5rem 1.25rem",
        borderTop: "1px solid rgba(42,157,143,0.12)",
        borderBottom: "1px solid rgba(42,157,143,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: "64rem",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "3.5rem",
          alignItems: "center",
        }}
      >
        {/* Visual */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: "1rem",
              backgroundColor: "var(--white)",
              borderRadius: "20px",
              padding: "2.5rem 2.75rem",
              boxShadow: "0 4px 32px rgba(15,61,56,0.09)",
            }}
          >
            {/* Generic translation */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--grey)",
                  marginBottom: "0.5rem",
                }}
              >
                Generic translator
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <Pill text="drug" bg="#f3f4f6" color="#374151" />
                <Arrow />
                <Pill text="droga ⚠️" bg="#FEF2F2" color="#991B1B" />
              </div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#991B1B",
                  marginTop: "0.5rem",
                }}
              >
                &ldquo;droga&rdquo; = illegal street drug in Spanish
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(42,157,143,0.15)",
                margin: "0.25rem 0",
              }}
              aria-hidden="true"
            />

            {/* MedLingua translation */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--grey)",
                  marginBottom: "0.5rem",
                }}
              >
                MedLingua
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <Pill text="drug" bg="#f3f4f6" color="#374151" />
                <Arrow />
                <Pill text="medicamento ✓" bg="#E6F2EF" color="#0F3D38" />
              </div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--teal-dark)",
                  marginTop: "0.5rem",
                }}
              >
                &ldquo;medicamento&rdquo; = medicine — clinically correct
              </p>
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--teal)",
              marginBottom: "0.875rem",
            }}
          >
            Why it&apos;s different
          </p>
          <h2
            id="drug-heading"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--deep-teal)",
              lineHeight: 1.1,
              marginBottom: "1.25rem",
            }}
          >
            Drug ≠ Droga.
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--ink)",
              lineHeight: 1.75,
              marginBottom: "1rem",
            }}
          >
            A general-purpose translator does exactly what you&apos;d expect — and exactly what
            you wouldn&apos;t want in a clinic. The Spanish word for the English &ldquo;drug&rdquo;
            in a medical context is <strong>medicamento</strong> or <strong>fármaco</strong>.
            &ldquo;Droga&rdquo; means an illegal street drug. A phrasebook doesn&apos;t know the
            difference. A patient reading it might be confused, alarmed, or non-compliant.
          </p>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--ink)",
              lineHeight: 1.75,
            }}
          >
            MedLingua was built for the clinic, not the travel guide. Every translation runs
            through a curated medical glossary that handles drug names, clinical abbreviations,
            and dosing language the way a trained interpreter would.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pill({
  text,
  bg,
  color,
}: {
  text: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontFamily: "var(--font-heading, sans-serif)",
        fontWeight: 600,
        fontSize: "0.9375rem",
        padding: "0.375rem 0.875rem",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function Arrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
