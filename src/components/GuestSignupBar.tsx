import { Link } from "react-router-dom";

/**
 * Sign-up bar fixed at the bottom of public pages for visitors without an account
 * (like Spotify's preview bar). Replaces "log in to see this" boxes inside the page.
 */
const GuestSignupBar = () => (
  <>
    {/* Keeps the end of the page from hiding behind the bar */}
    <div className="h-20 md:h-24" aria-hidden="true" />
    <div className="fixed inset-x-0 bottom-16 z-40 px-0 md:bottom-0 md:px-2 md:pb-2">
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 md:rounded-md md:px-5 md:py-3.5"
        style={{ background: "linear-gradient(90deg, #8C6A12 0%, #C99A22 100%)" }}
      >
        <div className="min-w-0">
          <p className="font-figtree text-sm font-bold text-white md:text-[15px]">Find and book artists for your event</p>
          <p className="hidden font-figtree text-sm text-white/90 sm:block">
            Sign up for free to message artists and send booking requests.
          </p>
        </div>
        <Link
          to="/register"
          className="shrink-0 rounded-full bg-white px-5 py-2.5 font-figtree text-sm font-bold text-black transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:px-7 md:py-3 md:text-base"
        >
          Sign up free
        </Link>
      </div>
    </div>
  </>
);

export default GuestSignupBar;
