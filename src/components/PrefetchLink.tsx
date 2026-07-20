import { useEffect, useRef } from "react";
import { Link, LinkProps } from "react-router-dom";
import { preloadForPath, queueIdlePreload } from "@/lib/routePreload";

/**
 * Înlocuitor drop-in pentru <Link> din react-router-dom.
 *
 * Preîncarcă chunk-ul rutei țintă în DOUĂ moduri, ca să acopere și desktop și mobil:
 *  1. Desktop: la hover/focus (mousedown-ul urmează, chunk-ul e deja cerut).
 *  2. Mobil: când linkul INTRĂ ÎN VIEWPORT. Pe touch nu există hover, iar
 *     onTouchStart se declanșează prea târziu (la tap). În schimb, când un link
 *     devine vizibil pe ecran, e un candidat probabil de tap — așa că îi cerem
 *     chunk-ul din timp, la idle, ca tap-ul să fie instant.
 *
 * Preload-urile din viewport sunt puse într-o coadă la idle (queueIdlePreload)
 * ca o listă lungă de carduri care intră deodată în viewport să nu declanșeze
 * zeci de importuri simultan și să nu concureze cu randarea.
 *
 * Utilizare: schimbă `import { Link } from "react-router-dom"`
 * cu `import { PrefetchLink as Link } from "@/components/PrefetchLink"`.
 */
export function PrefetchLink(props: LinkProps) {
  const { to, onMouseEnter, onFocus, ...rest } = props;
  const ref = useRef<HTMLAnchorElement | null>(null);

  const target = typeof to === "string" ? to : (to as any)?.pathname ?? "";

  // Preload imediat (hover/focus pe desktop).
  const triggerNow = () => {
    if (target) preloadForPath(target);
  };

  // Preload la idle când linkul e vizibil pe ecran (mobil).
  useEffect(() => {
    const el = ref.current;
    if (!el || !target) return;
    if (typeof IntersectionObserver === "undefined") return;

    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !done) {
            done = true;
            queueIdlePreload(target);
            io.disconnect();
            break;
          }
        }
      },
      {
        // Pornește preload-ul cu puțin înainte ca linkul să fie complet vizibil,
        // ca chunk-ul să fie gata când userul ajunge cu ochiul/degetul la el.
        rootMargin: "200px",
        threshold: 0.01,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <Link
      to={to}
      ref={ref}
      onMouseEnter={(e) => {
        triggerNow();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        triggerNow();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

export default PrefetchLink;
