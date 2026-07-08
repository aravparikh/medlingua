import DecoButton from "@/components/ui/DecoButton";
import { REGISTRATION_URL } from "@/lib/site";

/**
 * The site's primary call to action. Reads REGISTRATION_URL from lib/site.ts:
 * while it is null, every instance shows a dignified "opening soon" state;
 * set the URL once and they all become live links.
 */
export default function RegisterButton({
  className = "",
}: {
  className?: string;
}) {
  if (REGISTRATION_URL) {
    return (
      <DecoButton variant="solid" href={REGISTRATION_URL} external className={className}>
        Register Now
      </DecoButton>
    );
  }
  return (
    <span
      aria-disabled="true"
      className={`inline-flex h-12 min-w-44 cursor-default items-center justify-center border-2 border-gold/50 px-8 font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold/70 ${className}`}
    >
      Registration opening soon
    </span>
  );
}
