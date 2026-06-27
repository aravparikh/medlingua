/**
 * The cracked-M logo: an "M" with a seam/crack running through its center peak,
 * representing the language barrier broken open. SVG so it scales perfectly.
 */

interface CrackedMProps {
  size?: number;
  color?: string;
  crackColor?: string;
  className?: string;
}

export default function CrackedM({
  size = 40,
  color = "#2A9D8F",
  crackColor = "#0F3D38",
  className,
}: CrackedMProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* M letterform — two outer legs, two inner peaks */}
      <path
        d="M4 34V8l16 14L36 8v26"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Crack: a jagged fissure down the center peak */}
      <path
        d="M20 8 L18.5 16 L21 20 L18 26 L20 34"
        stroke={crackColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
