import CrackedM from "./CrackedM";

interface HeroProps {
  onJoinClick: () => void;
}

export default function Hero({ onJoinClick }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      style={{
        background: "linear-gradient(160deg, var(--paper) 0%, var(--teal-tint) 100%)",
        padding: "5rem 1.25rem 6rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "52rem", margin: "0 auto" }}>

        {/* Cracked-M mark */}
        <div className="fade-rise-1" style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: "var(--white)",
              boxShadow: "0 4px 24px rgba(15,61,56,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CrackedM size={48} />
          </div>
        </div>

        {/* Wordmark */}
        <div className="fade-rise-1">
          <p
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontWeight: 600,
              fontSize: "0.8125rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--teal)",
              marginBottom: "0.5rem",
            }}
          >
            MedLingua
          </p>
        </div>

        {/* Headline — bilingual moment */}
        <div className="fade-rise-2">
          <h1
            id="hero-heading"
            style={{
              fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
              fontWeight: 700,
              color: "var(--deep-teal)",
              lineHeight: 1.15,
              marginBottom: "0.5rem",
            }}
          >
            Healthcare everyone can understand.
          </h1>
          <p
            aria-label="Spanish translation: Atención médica que todos pueden entender."
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "var(--teal)",
              fontWeight: 500,
              fontStyle: "italic",
              marginBottom: "1.75rem",
            }}
          >
            Atención médica que todos pueden entender.
          </p>
        </div>

        {/* Subhead */}
        <div className="fade-rise-3">
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.1875rem)",
              color: "var(--grey)",
              lineHeight: 1.7,
              maxWidth: "40rem",
              margin: "0 auto 2.5rem",
            }}
          >
            Real-time English–Spanish medical translation that keeps every dose and drug name exact
            — on a phone you already own.
          </p>
        </div>

        {/* CTAs */}
        <div
          className="fade-rise-4"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.875rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onJoinClick}
            style={{
              backgroundColor: "var(--teal)",
              color: "var(--white)",
              fontFamily: "var(--font-heading, sans-serif)",
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.875rem 2rem",
              borderRadius: "8px",
              minHeight: "52px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 200ms ease-out, box-shadow 200ms ease-out",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal-dark)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(42,157,143,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            Join the Pilot
          </button>
        </div>
      </div>
    </section>
  );
}
