const points = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z"
          stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(42,157,143,0.08)" />
        <path d="M9 12l2 2 4-4" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    heading: "Assists certified interpreters",
    body: "MedLingua is a tool for the clinical team, not a bypass around human interpretation. Certified interpreters remain in the loop for consent conversations and complex care.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#2A9D8F" strokeWidth="2" fill="rgba(42,157,143,0.08)" />
        <path d="M12 8v4l3 3" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    heading: "Flags low-confidence translations",
    body: "When a translation is uncertain — unusual phrasing, rare drug name, ambiguous context — MedLingua surfaces a warning so the clinician knows to verify before acting.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" fill="rgba(42,157,143,0.08)" />
        <circle cx="9" cy="7" r="4" stroke="#2A9D8F" strokeWidth="2" fill="rgba(42,157,143,0.08)" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    heading: "Keeps a human in the loop",
    body: "Emergencies, informed consent, and nuanced conversations belong with qualified humans. MedLingua handles the routine friction so the care team has more bandwidth for what matters.",
  },
];

export default function TrustBand() {
  return (
    <section
      aria-labelledby="trust-heading"
      style={{
        backgroundColor: "var(--deep-teal)",
        padding: "5rem 1.25rem",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>

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
            Our commitment
          </p>
          <h2
            id="trust-heading"
            style={{
              color: "var(--paper)",
              fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)",
            }}
          >
            Built to assist, not replace.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {points.map((point) => (
            <div
              key={point.heading}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(42,157,143,0.2)",
                borderRadius: "16px",
                padding: "1.75rem",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>{point.icon}</div>
              <h3
                style={{
                  color: "var(--paper)",
                  fontSize: "1.0625rem",
                  marginBottom: "0.625rem",
                }}
              >
                {point.heading}
              </h3>
              <p
                style={{
                  color: "rgba(251,251,249,0.68)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.65,
                }}
              >
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
