import { useEffect, useRef, useState, useTransition, ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ține pagina VECHE vizibilă cât timp chunk-ul + randarea paginii NOI se
 * pregătesc, în loc să arate o pagină albă (Suspense fallback) la fiecare
 * navigare către o rută lazy neîncărcată.
 *
 * Cum: la schimbarea rutei, actualizăm location-ul folosit de <Routes> printr-o
 * tranziție (startTransition). React tratează update-ul ca non-urgent și
 * păstrează UI-ul curent randat cât timp cel nou se "suspendă" (chunk-ul se
 * descarcă). Când e gata, comută — fără ecran gol între ele.
 *
 * Utilizare în App.tsx:
 *   <TransitionRoutes>
 *     {(location) => <Routes location={location}>...</Routes>}
 *   </TransitionRoutes>
 *
 * `children` e o funcție care primește location-ul (posibil amânat) și randează
 * <Routes location={...}>. E important să pasezi acest location către <Routes>,
 * altfel router-ul comută instant și efectul dispare.
 */
export function TransitionRoutes({
  children,
}: {
  children: (location: ReturnType<typeof useLocation>) => ReactNode;
}) {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [isPending, startTransition] = useTransition();
  const barTimeout = useRef<number | null>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (location === displayedLocation) return;
    // Amână comutarea către noul location: React ține pagina veche pe ecran
    // până când cea nouă e gata de randat (chunk descărcat), apoi swap.
    startTransition(() => {
      setDisplayedLocation(location);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Indicator subtil de progres sus, dar DOAR dacă tranziția durează mai mult
  // de ~150ms (ex. chunk mare pe rețea lentă). Sub prag, nu apare nimic —
  // navigarea pare instant.
  useEffect(() => {
    if (isPending) {
      barTimeout.current = window.setTimeout(() => setShowBar(true), 150);
    } else {
      if (barTimeout.current) window.clearTimeout(barTimeout.current);
      setShowBar(false);
    }
    return () => {
      if (barTimeout.current) window.clearTimeout(barTimeout.current);
    };
  }, [isPending]);

  return (
    <>
      {showBar && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 9999,
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            animation: "i18n-nav-bar 1s ease-in-out infinite",
          }}
        />
      )}
      <style>{`@keyframes i18n-nav-bar{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}`}</style>
      {children(displayedLocation)}
    </>
  );
}

export default TransitionRoutes;
