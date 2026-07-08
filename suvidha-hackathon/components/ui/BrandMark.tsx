import Image from "next/image";

/**
 * Official Suvidha International Foundation logo (public/suvidha-logo.png).
 * Displayed clean and unfiltered per brand guidance — its own light
 * background keeps the navy mark legible against the dark theme.
 */
export default function BrandMark() {
  return (
    <Image
      src="/suvidha-logo.png"
      alt="Suvidha International Foundation"
      width={192}
      height={66}
      className="h-10 w-auto"
      priority
    />
  );
}
