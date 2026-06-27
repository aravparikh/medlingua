export default function Problem() {
  return (
    <section
      aria-labelledby="problem-heading"
      style={{
        backgroundColor: "var(--deep-teal)",
        padding: "5rem 1.25rem",
        color: "var(--paper)",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>

        <p
          style={{
            fontFamily: "var(--font-heading, sans-serif)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--teal)",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          The problem
        </p>

        <h2
          id="problem-heading"
          style={{
            color: "var(--paper)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            textAlign: "center",
            marginBottom: "3.5rem",
            maxWidth: "36rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Language barriers are a patient-safety crisis.
        </h2>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <StatCard
            number="27.6M"
            label="U.S. residents with limited English proficiency"
          />
          <StatCard
            number="49% vs 30%"
            label="Share of harm events causing physical injury — LEP patients vs. English-proficient patients"
          />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "1.0625rem",
            color: "rgba(251,251,249,0.75)",
            maxWidth: "42rem",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          The gap is worst in rural and under-resourced clinics — the places least likely to have
          a staff interpreter on call, and most likely to serve the patients who need one.
        </p>
      </div>
    </section>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(42,157,143,0.3)",
        borderRadius: "16px",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-heading, sans-serif)",
          fontSize: "clamp(2.25rem, 6vw, 3.25rem)",
          fontWeight: 700,
          color: "var(--teal)",
          lineHeight: 1,
          marginBottom: "0.75rem",
        }}
      >
        {number}
      </p>
      <p
        style={{
          fontSize: "1rem",
          color: "rgba(251,251,249,0.75)",
          lineHeight: 1.5,
        }}
      >
        {label}
      </p>
    </div>
  );
}
