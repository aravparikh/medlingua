import BrandMark from "./BrandMark";
import TwoVoices from "./TwoVoices";

interface HeroProps {
  onJoinClick: () => void;
}

const TAGLINES = [
  { lang: "es", text: "Hable con su médico — en su idioma." },
  { lang: "zh", text: "用您的语言，与医生交流。" },
  { lang: "vi", text: "Trò chuyện với bác sĩ — bằng ngôn ngữ của bạn." },
  { lang: "ru", text: "Говорите с врачом — на вашем языке." },
];

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

        {/* Brand mark — the app's drawn bubble + cross */}
        <div className="fade-rise-1" style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <BrandMark size={72} />
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

        {/* Headline — the app's own promise */}
        <div className="fade-rise-2">
          <h1
            id="hero-heading"
            style={{
              fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
              fontWeight: 700,
              color: "var(--deep-teal)",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            Speak with your doctor — in your language.
          </h1>
          <p
            aria-label="The same promise in Spanish, Chinese, Vietnamese, and Russian"
            style={{
              fontSize: "clamp(0.9375rem, 2.2vw, 1.0625rem)",
              color: "var(--grey)",
              lineHeight: 1.9,
              maxWidth: "44rem",
              margin: "0 auto 1.75rem",
            }}
          >
            {TAGLINES.map((t, i) => (
              <span key={t.lang} lang={t.lang}>
                {t.text}
                {i < TAGLINES.length - 1 ? <span aria-hidden="true">{"  ·  "}</span> : null}
              </span>
            ))}
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
            Real-time medical conversation between English and Spanish, Chinese, Vietnamese, or
            Russian — doses and drug names kept exact, nothing ever saved, on a phone you already own.
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
            marginBottom: "3rem",
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
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(20,87,78,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            Join the Pilot
          </button>
        </div>

        {/* The scene the app opens with: two people, one conversation. */}
        <div className="fade-rise-4" style={{ display: "flex", justifyContent: "center" }}>
          <TwoVoices width={300} />
        </div>
      </div>
    </section>
  );
}
