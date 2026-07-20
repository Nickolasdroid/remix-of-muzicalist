/**
 * Registry care mapează prefixul unei rute la funcția ei de preload.
 * Folosit ca să preîncărcăm chunk-ul unei pagini când userul dă hover/focus
 * pe un link către ea, sau la idle pentru rutele cele mai vizitate.
 *
 * Se populează din App.tsx (vezi registerPreload). Ținem un map simplu ca să
 * nu duplicăm lista de import-uri.
 */

type PreloadFn = () => Promise<unknown>;

const registry = new Map<string, PreloadFn>();

/** Înregistrează preload-ul unei rute. `path` e prefixul, ex. "/artists". */
export function registerPreload(path: string, fn: PreloadFn) {
  registry.set(path, fn);
}

/** Preload pentru un path exact sau cel mai lung prefix care se potrivește. */
export function preloadForPath(path: string) {
  if (!path) return;
  // potrivire exactă întâi
  const exact = registry.get(path);
  if (exact) {
    exact();
    return;
  }
  // altfel, cel mai lung prefix înregistrat care se potrivește
  let best: PreloadFn | null = null;
  let bestLen = -1;
  for (const [key, fn] of registry) {
    if (key !== "/" && path.startsWith(key) && key.length > bestLen) {
      best = fn;
      bestLen = key.length;
    }
  }
  best?.();
}

/** Preîncarcă în fundal, la idle, rutele cel mai des accesate. */
export function preloadPopularRoutes(paths: string[]) {
  const run = () => paths.forEach((p) => preloadForPath(p));
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 2000);
  }
}

/**
 * Coadă de preload procesată una câte una la idle.
 *
 * Folosită de PrefetchLink pentru preload-ul din viewport pe mobil: când o
 * listă lungă de carduri intră deodată în viewport, în loc să declanșăm zeci
 * de importuri simultan (care ar concura cu randarea și rețeaua), le punem în
 * coadă și le scoatem pe rând, câte unul per fereastră de idle. Fiecare path
 * unic e preîncărcat o singură dată.
 */
const idleQueue: string[] = [];
const queued = new Set<string>();
let draining = false;

const scheduleIdle = (fn: () => void) => {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 200);
  }
};

const drain = () => {
  const path = idleQueue.shift();
  if (path === undefined) {
    draining = false;
    return;
  }
  preloadForPath(path);
  scheduleIdle(drain);
};

/** Pune un path în coada de preload la idle (dedup pe path). */
export function queueIdlePreload(path: string) {
  if (!path || queued.has(path)) return;
  queued.add(path);
  idleQueue.push(path);
  if (!draining) {
    draining = true;
    scheduleIdle(drain);
  }
}
