/**
 * Decorative L-shaped brackets at opposite corners of a card.
 * Parent must be `relative`. Opacity intensifies when the parent
 * is a `group` being hovered.
 */
export default function CornerBrackets() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-gold opacity-50 transition-opacity duration-500 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-gold opacity-50 transition-opacity duration-500 group-hover:opacity-100"
      />
    </>
  );
}
