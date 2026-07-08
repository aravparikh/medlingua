type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/** Centered heading flanked by measured gold divider lines. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-16 max-w-3xl text-center">
      {eyebrow && (
        <p className="mb-4 font-body text-xs font-semibold uppercase tracking-[0.35em] text-gold/70">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center justify-center gap-6">
        <span aria-hidden="true" className="h-px w-16 bg-gold/60 sm:w-24" />
        <span
          aria-hidden="true"
          className="size-2 rotate-45 border border-gold bg-transparent"
        />
        <span aria-hidden="true" className="h-px w-16 bg-gold/60 sm:w-24" />
      </div>
      <h2 className="mt-6 font-display text-3xl uppercase tracking-widest text-cream sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 font-body text-lg leading-relaxed text-pewter">
          {subtitle}
        </p>
      )}
      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-px w-24 bg-linear-to-r from-transparent via-gold to-transparent"
      />
    </div>
  );
}
