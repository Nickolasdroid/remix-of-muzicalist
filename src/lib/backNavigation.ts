import type { NavigateFunction } from "react-router-dom";

/**
 * Back navigation that never leaves the site.
 *
 * `window.history.length` also counts pages from other sites (Google, WhatsApp…),
 * so it can't tell whether "back" stays inside Muzicalist. React Router keeps
 * its own index in `history.state.idx`: 0 means this is the first page the user
 * opened here (direct link, new tab, installed app).
 */
export const canGoBackInApp = (): boolean => {
  if (typeof window === "undefined") return false;
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === "number" && idx > 0;
};

/** Pages reached from the bottom bar / menu: they show the menu, not a back arrow. */
const ROOT_PATHS = new Set([
  "/",
  "/feed",
  "/announcements",
  "/messages",
  "/search",
  "/dashboard",
  "/user-dashboard",
  "/login",
  "/register",
  "/admin/dashboard",
]);

export const isRootPath = (pathname: string): boolean => ROOT_PATHS.has(pathname.replace(/\/+$/, "") || "/");

/** Where "back" goes when there is no in-app history (the page was opened directly). */
export const parentPathFor = (pathname: string, loggedIn: boolean): string => {
  const home = loggedIn ? "/feed" : "/";
  const p = pathname.replace(/\/+$/, "");
  const seg = p.split("/").filter(Boolean);

  if (seg[0] === "artist" && seg[1]) return seg[2] === "reviews" ? `/artist/${seg[1]}` : loggedIn ? "/feed" : "/artists";
  if (seg[0] === "book" && seg[1]) return `/artist/${seg[1]}`;
  if (seg[0] === "post") return "/feed";
  if (seg[0] === "categories" && seg[1]) return "/categories";
  if (seg[0] === "countries" && seg[1]) return "/countries";
  if (seg[0] === "counties" && seg[2]) return `/counties/${seg[1]}`;
  if (seg[0] === "counties" && seg[1]) return "/counties";
  if (seg[0] === "register" && seg[1]) return "/register";
  if (seg[0] === "dashboard" && seg[1]) return "/dashboard";
  if (seg[0] === "admin" && seg[1] && seg[1] !== "dashboard") return "/admin/dashboard";
  return home;
};

/** Go to the previous page inside the app, or to the logical parent page. */
export const goBack = (navigate: NavigateFunction, fallback: string): void => {
  if (canGoBackInApp()) navigate(-1);
  else navigate(fallback, { replace: true });
};
