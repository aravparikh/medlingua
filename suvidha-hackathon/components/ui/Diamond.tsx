import type { ReactNode } from "react";

type DiamondProps = {
  children: ReactNode;
  /** Tailwind size class for the square, e.g. "size-24" */
  sizeClass?: string;
  className?: string;
};

/**
 * Rotated-diamond container — the content counter-rotates to stay upright.
 * Used for host avatars, prize numerals, and future judge photos.
 */
export default function Diamond({
  children,
  sizeClass = "size-24",
  className = "",
}: DiamondProps) {
  return (
    <div
      className={`${sizeClass} rotate-45 border border-gold bg-obsidian shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] ${className}`}
    >
      <div className="flex size-full -rotate-45 items-center justify-center">
        {children}
      </div>
    </div>
  );
}
