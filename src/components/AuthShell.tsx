import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.webp";

/** Input style for the account pages: label above, grey outline that turns white on hover. */
export const authInputClass =
  "h-12 rounded-md border border-[#727272] bg-[#121212] px-3.5 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-foreground focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0";

/** Gold pill for the one main action of an account page. */
export const authButtonClass =
  "h-12 w-full rounded-full bg-accent text-base font-bold text-accent-foreground transition-transform hover:scale-[1.02] hover:bg-accent disabled:opacity-60";

/**
 * Frame for log in / password pages: logo and name top left (link home), then the form
 * centered on the page, without a card.
 */
const AuthShell = ({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-[#121212]">
    {/* The way back to the site */}
    <header className="flex h-16 items-center px-6 md:h-20 md:px-8">
      <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
        <img src={logo} alt="" className="h-8 w-8 object-contain" />
        <span className="font-bold text-lg text-foreground uppercase" style={{ fontFamily: "Montserrat, 'Montserrat Fallback', sans-serif", letterSpacing: "-0.02em" }}>
          Muzicalist
        </span>
      </Link>
    </header>
    {/* No card: the form sits straight on the page, centered */}
    <div className="flex flex-1 items-start justify-center px-6 pb-12 pt-6 md:items-center md:pb-24 md:pt-0">
      <div className="w-full max-w-[324px]">
        <h1 className="text-center text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground">{title}</h1>
        <div className="mt-10">{children}</div>
        {footer && (
          <div className="mt-10 border-t border-[#292929] pt-8 text-center text-base text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  </div>
);

export default AuthShell;
