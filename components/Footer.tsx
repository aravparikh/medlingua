import BrandMark from "./BrandMark";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "var(--deep-teal)",
        padding: "3rem 1.25rem",
        color: "rgba(251,251,249,0.65)",
      }}
    >
      <div
        style={{
          maxWidth: "64rem",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <BrandMark size={28} tile={false} />
          <span
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--paper)",
            }}
          >
            MedLingua
          </span>
        </div>

        {/* Attribution + legal */}
        <p style={{ fontSize: "0.875rem", textAlign: "center" }}>
          Built by{" "}
          <strong style={{ color: "var(--paper)", fontWeight: 600 }}>Arav Parikh</strong>
          {" · "}Vista del Lago High School
          {" · "}
          <a href="/privacy" style={{ color: "rgba(251,251,249,0.75)" }}>Privacy</a>
          {" · "}
          <a href="/terms" style={{ color: "rgba(251,251,249,0.75)" }}>Terms</a>
        </p>

        {/* SDG Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(42,157,143,0.25)",
            borderRadius: "999px",
            padding: "0.375rem 0.875rem",
          }}
          title="UN Sustainable Development Goal 3: Good Health and Well-Being"
        >
          <span style={{ fontSize: "1.1rem" }} aria-hidden="true">🌍</span>
          <span style={{ fontSize: "0.8125rem", color: "rgba(251,251,249,0.75)", fontWeight: 500 }}>
            SDG 3 · Good Health &amp; Well-Being
          </span>
        </div>
      </div>
    </footer>
  );
}
