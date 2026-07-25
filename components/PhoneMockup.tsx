/**
 * The product shot, drawn — not screenshotted. A hand-coded phone showing the
 * conversation screen mid-conversation, built from the exact theme colors and
 * icon paths the app ships (mobile/src/components/icons), so it can never
 * drift off-brand. Decorative to assistive tech; the label says what it shows.
 */

const S = 2.5; // the icon language's stroke width

function Glyph({
  paths,
  size = 12,
  color,
  dash,
  dot,
}: {
  paths: string[];
  size?: number;
  color: string;
  dash?: string;
  dot?: { cx: number; cy: number; r: number };
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dot ? <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={color} /> : null}
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
      ))}
    </svg>
  );
}

// Paths verbatim from the app's glyph set.
const ARC = ['M11.6 8.6a4.9 4.9 0 0 1 0 6.8', 'M15.2 5.8a9 9 0 0 1 0 12.4'];
const ARC_DOT = { cx: 6.2, cy: 12, r: 2.1 };
// The mic element as a true capsule — a flat-topped path read as an arrow at
// button size.
const MIC = [
  'M12 3a2.6 2.6 0 0 1 2.6 2.6v5.4a2.6 2.6 0 0 1-5.2 0V5.6A2.6 2.6 0 0 1 12 3Z',
  'M5.6 11.4v.6a6.4 6.4 0 0 0 12.8 0v-.6',
  'M12 18.4V21',
];
const EYE = ['M3.5 12c2.5-4.1 5.3-6.1 8.5-6.1s6 2 8.5 6.1c-2.5 4.1-5.3 6.1-8.5 6.1S6 16.1 3.5 12Z', 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'];
const EXPAND = ['M14.4 4.6h5v5M19.2 4.8l-5.6 5.6', 'M9.6 19.4h-5v-5M4.8 19.2l5.6-5.6'];

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: 'var(--teal-tint)',
  borderRadius: 999,
  padding: '5px 10px',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--teal)',
  fontFamily: 'var(--font-body, sans-serif)',
};

export default function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="The MedLingua conversation screen: a Spanish sentence, its English translation spoken aloud, and one big speak button per language"
      style={{
        width: 292,
        borderRadius: 44,
        backgroundColor: 'var(--teal-dark)',
        padding: 10,
        boxShadow: '0 24px 64px rgba(12,48,43,0.28)',
        flexShrink: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          // Concentric with the 44 device frame minus its 10 bezel.
          borderRadius: 34,
          backgroundColor: 'var(--paper)',
          overflow: 'hidden',
          padding: '14px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 560,
        }}
      >
        {/* Header chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: 'var(--grey)', fontWeight: 600 }}>
          <span>Idioma · Language</span>
          <span>Privacidad · Privacy</span>
        </div>

        {/* The latest turn card — accent bar on the tail side, arc on the live line */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            borderRadius: 14,
            borderRight: '3px solid var(--accent)',
            padding: 12,
            boxShadow: '0 4px 16px rgba(12,48,43,0.10)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: 8,
                backgroundColor: 'var(--indigo-tint)',
                color: 'var(--indigo)',
                fontSize: 7,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Es
            </span>
            <span style={{ fontSize: 7.5, letterSpacing: '0.06em', color: 'var(--grey)', fontWeight: 600 }}>USTED DIJO</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>Me duele el pecho.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Glyph paths={ARC} dot={ARC_DOT} size={10} color="var(--accent)" />
            <span style={{ fontSize: 7.5, letterSpacing: '0.06em', color: 'var(--teal)', fontWeight: 600 }}>TRANSLATION</span>
            <span style={{ flex: 1 }} />
            <Glyph paths={EXPAND} size={10} color="var(--grey)" />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 19,
              lineHeight: 1.25,
              fontWeight: 700,
              color: 'var(--ink)',
              fontFamily: 'var(--font-heading, sans-serif)',
            }}
          >
            I have chest pain.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <span style={{ ...pill, flex: 1 }}>
              <Glyph paths={ARC} dot={ARC_DOT} size={10} color="var(--teal)" />
              Play again
            </span>
            <span style={{ ...pill, flex: 1 }}>
              <Glyph paths={ARC} dot={ARC_DOT} dash="0.1 4.2" size={10} color="var(--teal)" />
              Slowly
            </span>
          </div>
          <span style={{ ...pill }}>
            <Glyph paths={EYE} size={10} color="var(--teal)" />
            Show
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* The two speak buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { bg: 'var(--teal)', label: 'Speak English' },
            { bg: 'var(--indigo)', label: 'Hablar español' },
          ].map((b) => (
            <div
              key={b.label}
              style={{
                flex: 1,
                borderRadius: 18,
                backgroundColor: b.bg,
                padding: '14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph paths={MIC} size={13} color="var(--white)" />
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--white)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-heading, sans-serif)',
                }}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 7.5, textAlign: 'center', color: 'var(--grey)' }}>
          Su conversación es privada · Nothing is saved
        </p>
      </div>
    </div>
  );
}
