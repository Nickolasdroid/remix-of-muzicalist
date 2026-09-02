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

function reloadOnce() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    /* storage indisponibil - continuăm oricum */
  }
  window.location.reload();
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

  const load = () => {
    if (!promise) {
      promise = factory().catch((error) => {
        // Resetăm memoizarea ca următoarea încercare să nu refolosească
        // promisiunea respinsă.
        promise = null;
        if (!isChunkLoadError(error)) throw error;
        return factory().catch((retryError) => {
          promise = null;
          if (isChunkLoadError(retryError)) reloadOnce();
          throw retryError;
        });
      });
    }
    return promise;
  };

  const Component = lazy(load) as PreloadableComponent<T>;
  Component.preload = load;
  return Component;
}
