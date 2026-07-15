/**
 * The MedLingua logo mark — the speech bubble carrying the medical cross,
 * drawn with the exact paths the app ships (mobile/src/components/icons).
 * `tile` wraps it in the rounded brand tile the app uses for its lockup.
 */
export default function BrandMark({
  size = 32,
  tile = true,
}: {
  size?: number;
  tile?: boolean;
}) {
  const mark = (
    <svg
      width={tile ? size * 0.62 : size}
      height={tile ? size * 0.62 : size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.4c-5 0-9 3-9 6.8 0 2.2 1.3 4.1 3.2 5.3l-.5 4.3 4.2-1.9c.7.1 1.4.2 2.1.2 5 0 9-3 9-6.8s-4-6.9-9-6.9Z"
        fill="var(--white)"
      />
      <path
        d="M12 7.6v5.2M9.4 10.2h5.2"
        stroke="var(--teal)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );

  if (!tile) return mark;

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: "var(--teal)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {mark}
    </span>
  );
}
