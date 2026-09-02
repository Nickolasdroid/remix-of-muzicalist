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

function reloadOnce(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    /* storage indisponibil - continuăm oricum */
  }
  window.location.reload();
  return true;
}

if (typeof window !== "undefined") {
  // După o încărcare reușită, resetăm flag-ul ca un viitor deploy să poată
  // declanșa din nou un reload.
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* noop */
    }
  }, 10000);
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

