import { Loader2 } from "lucide-react";

/**
 * Top bar of a composer on phones (Instagram-style): Cancel · title · Publish.
 * Hidden from md up, where the composer is a regular dialog.
 */
const MobileComposerHeader = ({
  title,
  onCancel,
  actionLabel,
  onAction,
  disabled,
  busy,
}: {
  title: string;
  onCancel: () => void;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
}) => (
  <div className="md:hidden grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-2">
    <button
      type="button"
      onClick={onCancel}
      className="justify-self-start rounded-md px-2 py-1.5 text-[15px] text-foreground/80 hover:text-foreground"
    >
      Cancel
    </button>
    <p className="truncate text-[15px] font-semibold text-foreground">{title}</p>
    <button
      type="button"
      onClick={onAction}
      disabled={disabled || busy}
      className="justify-self-end inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-40"
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {actionLabel}
    </button>
  </div>
);

/** DialogContent classes that turn a dialog into a full-screen page below md. */
export const FULLSCREEN_ON_MOBILE =
  "max-md:inset-0 max-md:left-0 max-md:top-0 max-md:translate-x-0 max-md:translate-y-0 max-md:!w-screen max-md:!max-w-none max-md:h-[100dvh] max-md:!max-h-none max-md:rounded-none max-md:border-0 max-md:data-[state=open]:slide-in-from-bottom-4 max-md:data-[state=open]:slide-in-from-left-0 max-md:data-[state=open]:zoom-in-100 max-md:[&>button:last-child]:hidden";

export default MobileComposerHeader;
