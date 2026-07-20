import { lazy, ComponentType } from "react";

/**
 * Ca React.lazy, dar expune și o funcție `.preload()` care declanșează
 * descărcarea chunk-ului ÎNAINTE ca ruta să fie randată.
 *
 * Importul e memorat: dacă preload() a fost deja apelat (ex. la hover),
 * click-ul ulterior refolosește aceeași promisiune și randarea e instant.
 */
export type PreloadableComponent<T extends ComponentType<any>> =
  React.LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> };

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
  let promise: Promise<{ default: T }> | null = null;

  const load = () => {
    if (!promise) {
      promise = factory();
    }
    return promise;
  };

  const Component = lazy(load) as PreloadableComponent<T>;
  Component.preload = load;
  return Component;
}
