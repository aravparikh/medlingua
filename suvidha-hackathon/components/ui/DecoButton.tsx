import type { ReactNode } from "react";

type Variant = "default" | "solid" | "outline";

const base =
  "inline-flex h-12 min-w-44 items-center justify-center px-8 font-body text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian";

const variants: Record<Variant, string> = {
  default:
    "border-2 border-gold bg-transparent text-gold hover:bg-gold hover:text-obsidian hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]",
  solid:
    "bg-gold text-obsidian shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:bg-gold-light hover:shadow-[0_0_25px_rgba(212,175,55,0.45)]",
  outline:
    "border border-gold bg-transparent text-cream hover:bg-midnight hover:border-gold-light",
};

type DecoButtonProps = {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  external?: boolean;
  className?: string;
};

/** Sharp-cornered Art Deco button. Renders a link when `href` is given. */
export default function DecoButton({
  children,
  variant = "default",
  href,
  external,
  className = "",
}: DecoButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return <span className={classes}>{children}</span>;
}
