import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/** Input style for the account pages: label above, grey outline that turns white on hover. */
export const authInputClass =
  "h-12 rounded-md border border-[#727272] bg-[#121212] px-3.5 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-foreground focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0";

/** Gold pill for the one main action of an account page. */
export const authButtonClass =
  "h-12 w-full rounded-full bg-accent text-base font-bold text-accent-foreground transition-transform hover:scale-[1.02] hover:bg-accent disabled:opacity-60";

/**
 * Frame for log in / password pages, same as the public home page: the black top bar,
 * then one rounded panel with the soft gold glow at the top; the form centered in it,
 * the footer at the bottom of the panel.
 */
const AuthShell = ({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) => (
  <div className="min-h-screen bg-black">
    <Navigation />
    <main className="px-0 pb-2 pt-14 md:px-2 md:pt-[72px]">
      <div className="overflow-hidden rounded-none bg-background md:rounded-lg">
        <div
          className="flex min-h-[calc(100vh-56px)] items-start justify-center px-6 pb-16 pt-10 md:min-h-[calc(100vh-80px)] md:items-center md:pt-12"
          style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
        >
          <div className="w-full max-w-[324px]">
            <h1 className="text-center text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground">{title}</h1>
            <div className="mt-10">{children}</div>
            {footer && (
              <div className="mt-10 border-t border-[#292929] pt-8 text-center text-base text-muted-foreground">{footer}</div>
            )}
          </div>
        </div>
        <Footer embedded />
      </div>
    </main>
  </div>
);

export default AuthShell;
