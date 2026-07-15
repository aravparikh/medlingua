/**
 * The app's empty-state scene, on the web: two capsule figures — teal
 * clinician, indigo patient — with the sound arc traveling between them
 * and a dotted reply. The same drawing the app ships (icons/scenes.tsx).
 */
export default function TwoVoices({ width = 300 }: { width?: number }) {
  const height = (width * 102) / 260;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 102"
      fill="none"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      <circle cx={40} cy={30} r={13} stroke="var(--teal)" fill="var(--white)" />
      <rect x={26} y={49} width={28} height={44} rx={14} stroke="var(--teal)" fill="var(--white)" />
      <circle cx={220} cy={30} r={13} stroke="var(--indigo)" fill="var(--white)" />
      <rect x={206} y={49} width={28} height={44} rx={14} stroke="var(--indigo)" fill="var(--white)" />
      <circle cx={80} cy={58} r={4.2} fill="var(--teal)" />
      <path d="M94 46a14.5 14.5 0 0 1 0 24" stroke="var(--accent)" />
      <path d="M108 38a25 25 0 0 1 0 40" stroke="var(--accent)" />
      <circle cx={180} cy={58} r={4.2} fill="var(--indigo)" />
      <path d="M166 48a12.5 12.5 0 0 0 0 20" stroke="var(--accent)" strokeDasharray="0.1 7" />
    </svg>
  );
}
