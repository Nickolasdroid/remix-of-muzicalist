import { lazy, ComponentType } from "react";

/**
 * Ca React.lazy, dar expune și o funcție `.preload()` care declanșează
 * descărcarea chunk-ului ÎNAINTE ca ruta să fie randată.
 *
 * Importul e memorat: dacă preload() a fost deja apelat (ex. la hover),
 * click-ul ulterior refolosește aceeași promisiune și randarea e instant.
 *
 * În plus, dacă importul dinamic eșuează (chunk vechi dispărut după un
 * deploy nou -> "Failed to fetch dynamically imported module"), reîncercăm
 * o dată, iar dacă tot eșuează facem un singur reload al paginii ca să
 * luăm noul index.html cu hash-urile actualizate (fără buclă de reload).
 */
export type PreloadableComponent<T extends ComponentType<any>> =
  React.LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> };

const RELOAD_FLAG = "lovable:chunk-reload";

function isChunkLoadError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed")
  );
}

// Reload at most once per 30s window — prevents loops while still allowing
// recovery after each new deploy (a sticky flag could block later reloads).
export function reloadOnce(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    /* storage indisponibil - continuăm oricum */
  }
  window.location.reload();
  return true;
}

if (typeof window !== "undefined") {
  // Vite emits this when a preloaded chunk (or its CSS) is missing after a
  // new deploy. Reload to fetch the fresh index.html instead of a blank screen.
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnce()) event.preventDefault();
  });
}

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
  let promise: Promise<{ default: T }> | null = null;

  const sleep = (ms: number) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  const loadWithRetry = async (): Promise<{ default: T }> => {
    const delays = [0, 400, 1200];
    let lastError: unknown;

    for (const delay of delays) {
      if (delay) await sleep(delay);
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        // Erorile care nu au legătură cu chunk-urile se propagă imediat.
        if (!isChunkLoadError(error)) {
          promise = null;
          throw error;
        }
      }
    }

    // Toate încercările au eșuat: chunk-ul chiar nu mai există (deploy nou).
    // Facem un singur reload și lăsăm promisiunea nerezolvată ca Suspense
    // să afișeze fallback-ul în loc de un ecran alb.
    promise = null;
    if (reloadOnce()) {
      return new Promise<{ default: T }>(() => {});
    }
    throw lastError;
  };

  const load = () => {
    if (!promise) promise = loadWithRetry();
    return promise;
  };

  const Component = lazy(load) as PreloadableComponent<T>;
  Component.preload = load;
  return Component;
}

