import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — MedLingua",
  description: "The terms for using MedLingua, a communication aid for medical visits.",
};

const updated = "July 8, 2026";

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 96px" }}>
      <Link href="/" style={{ color: "var(--teal-dark)", fontWeight: 600, textDecoration: "none" }}>
        ← MedLingua
      </Link>
      <h1 style={{ marginTop: 24, fontSize: "2rem", color: "var(--deep-teal)" }}>Terms of Use</h1>
      <p style={{ color: "#5A6B66" }}>Last updated: {updated}</p>

      <h2 style={h2}>1. What MedLingua is</h2>
      <p style={p}>
        MedLingua is a communication aid that translates spoken and written language during medical
        visits using AI. By using the app you agree to these terms.
      </p>

      <h2 style={h2}>2. Not medical advice, not a medical device</h2>
      <p style={p}>
        MedLingua does not diagnose, treat, or give medical advice, and it is not a regulated medical
        device. AI translation can make mistakes, including mistakes about medications and doses.
        <strong> Do not rely on MedLingua for critical-care or high-stakes medical decisions.</strong>{" "}
        For those, ask for a certified medical interpreter — in the U.S. you have a legal right to one
        at no cost in most healthcare settings.
      </p>

      <h2 style={h2}>3. Emergencies</h2>
      <p style={p}>
        MedLingua is not an emergency service. In an emergency, call your local emergency number
        (911 in the U.S.) immediately.
      </p>

      <h2 style={h2}>4. Acceptable use</h2>
      <p style={p}>
        Use the app only for lawful, personal communication. Automated, bulk, or abusive use of the
        translation service may be rate-limited or blocked.
      </p>

      <h2 style={h2}>5. AI processing</h2>
      <p style={p}>
        Content you submit (voice, text, label photos) is processed by our AI service provider as
        described in the{" "}
        <Link href="/privacy" style={a}>
          Privacy Policy
        </Link>
        . Nothing is stored by MedLingua after processing.
      </p>

      <h2 style={h2}>6. No warranty; limitation of liability</h2>
      <p style={p}>
        The app is provided &quot;as is&quot;, without warranties of any kind, including accuracy of
        translations. To the maximum extent permitted by law, MedLingua and its creator are not liable
        for any damages arising from use of the app, including decisions made based on a translation.
      </p>

      <h2 style={h2}>7. Changes</h2>
      <p style={p}>
        These terms may be updated; the date above reflects the current version. Continued use after a
        change means you accept the updated terms.
      </p>

      <h2 style={h2}>8. Contact</h2>
      <p style={p}>
        Questions:{" "}
        <a href="mailto:hello@medlingua.app" style={a}>
          hello@medlingua.app
        </a>
        .
      </p>
    </main>
  );
}

const h2: React.CSSProperties = { marginTop: 36, fontSize: "1.25rem", color: "var(--deep-teal)" };
const p: React.CSSProperties = { lineHeight: 1.7, color: "#333" };
const a: React.CSSProperties = { color: "var(--teal-dark)" };
