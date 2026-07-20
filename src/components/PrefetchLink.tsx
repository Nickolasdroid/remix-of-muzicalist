import { Link, LinkProps } from "react-router-dom";
import { preloadForPath } from "@/lib/routePreload";

/**
 * Înlocuitor drop-in pentru <Link> din react-router-dom.
 * Când userul dă hover sau focus pe link, preîncarcă chunk-ul rutei țintă,
 * așa că la click pagina e deja în cache și randează instant (fără pauză).
 *
 * Utilizare: schimbă `import { Link } from "react-router-dom"`
 * cu `import { PrefetchLink as Link } from "@/components/PrefetchLink"`.
 */
export function PrefetchLink(props: LinkProps) {
  const { to, onMouseEnter, onFocus, onTouchStart, ...rest } = props;

  const target = typeof to === "string" ? to : (to as any)?.pathname ?? "";

  const trigger = () => {
    if (target) preloadForPath(target);
  };

  return (
    <Link
      to={to}
      onMouseEnter={(e) => {
        trigger();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        trigger();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        trigger();
        onTouchStart?.(e);
      }}
      {...rest}
    />
  );
}

export default PrefetchLink;
