import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — MedLingua",
  description: "How MedLingua handles your voice, photos, and words: processed in the moment, never stored.",
};

const updated = "July 8, 2026";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 96px" }}>
      <Link href="/" style={{ color: "var(--teal-dark)", fontWeight: 600, textDecoration: "none" }}>
        ← MedLingua
      </Link>
      <h1 style={{ marginTop: 24, fontSize: "2rem", color: "var(--deep-teal)" }}>Privacy Policy</h1>
      <p style={{ color: "#5A6B66" }}>Last updated: {updated}</p>

      <h2 style={h2}>The short version</h2>
      <p style={p}>
        MedLingua translates medical conversations in the moment and then forgets them. We have no
        accounts, no databases of conversations, and no advertising. Nothing you say, type, or
        photograph is stored by MedLingua after it has been translated.
      </p>

      <h2 style={h2}>What the app processes</h2>
      <ul style={ul}>
        <li style={li}>
          <strong>Voice recordings</strong> — when you tap a speak button, your speech is recorded and
          sent for transcription and translation. The recording is deleted from your device when the
          next recording starts, and is never uploaded anywhere except for the translation itself.
        </li>
        <li style={li}>
          <strong>Typed text</strong> — text you type for translation is sent for translation only.
        </li>
        <li style={li}>
          <strong>Medication label photos</strong> — a photo you take of a label is sent once for
          reading, then deleted from the device. It is never saved to your photo library by the app.
        </li>
        <li style={li}>
          <strong>Visit summaries</strong> — generated on request, shown behind a visible countdown,
          and destroyed when the countdown ends. If you copy or share a summary, the copy lives
          wherever <em>you</em> put it — MedLingua keeps none.
        </li>
      </ul>

      <h2 style={h2}>Who processes it</h2>
      <p style={p}>
        Translation, transcription, label reading, and speech audio are processed by{" "}
        <strong>OpenAI</strong> (our AI service provider) over encrypted connections, via a server we
        control. We send only the content needed for the translation itself — no name, no account, no
        contact information, no location. Requests carry a random installation identifier used solely
        to prevent abuse (rate limiting); it is not linked to you and resets if you reinstall the app.
        OpenAI&apos;s handling of API data is described in their{" "}
        <a href="https://openai.com/policies/api-data-usage-policies" style={a}>
          API data usage policy
        </a>
        .
      </p>

      <h2 style={h2}>What stays on your phone</h2>
      <p style={p}>
        Only three small preferences: your chosen language, the auto-detect setting, and whether
        you&apos;ve seen the first-run notice. The conversation thread lives in memory only and is gone
        when you switch languages or close the app.
      </p>

      <h2 style={h2}>What we don&apos;t do</h2>
      <ul style={ul}>
        <li style={li}>No accounts, sign-ins, or profiles</li>
        <li style={li}>No analytics on conversation content</li>
        <li style={li}>No advertising or tracking of any kind</li>
        <li style={li}>No sale or sharing of data with anyone besides the AI processing described above</li>
      </ul>

      <h2 style={h2}>Not a medical device</h2>
      <p style={p}>
        MedLingua is a communication aid. It is not a medical device, does not provide medical advice,
        and is not a substitute for a certified medical interpreter. For important medical decisions,
        ask your provider for a certified interpreter — in the U.S. you have a right to one at no cost.
      </p>

      <h2 style={h2}>Children</h2>
      <p style={p}>MedLingua is not directed at children under 13 and collects no personal information from anyone.</p>

      <h2 style={h2}>Changes & contact</h2>
      <p style={p}>
        If this policy changes, the date above changes with it. Questions:{" "}
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
const ul: React.CSSProperties = { lineHeight: 1.7, color: "#333", paddingLeft: 22 };
const li: React.CSSProperties = { marginBottom: 8 };
const a: React.CSSProperties = { color: "var(--teal-dark)" };
