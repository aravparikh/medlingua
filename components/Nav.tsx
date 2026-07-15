"use client";

import BrandMark from "./BrandMark";

interface NavProps {
  onJoinClick: () => void;
}

export default function Nav({ onJoinClick }: NavProps) {
  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(247,245,241,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(20,87,78,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          aria-label="MedLingua — home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <BrandMark size={32} />
          <span
            style={{
              fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "var(--deep-teal)",
              letterSpacing: "-0.01em",
            }}
          >
            MedLingua
          </span>
        </a>

        {/* CTA */}
        <button
          onClick={onJoinClick}
          style={{
            backgroundColor: "var(--teal)",
            color: "var(--white)",
            fontFamily: "var(--font-heading, sans-serif)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            padding: "0.625rem 1.375rem",
            borderRadius: "8px",
            minHeight: "44px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 200ms ease-out, box-shadow 200ms ease-out",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal-dark)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(42,157,143,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          Join the Pilot
        </button>
      </div>
    </header>
  );
}
