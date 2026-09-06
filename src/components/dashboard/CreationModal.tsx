import * as React from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Shared visual shell for Muzicalist content-creation modals
 * (Add a post / Add an announcement).
 * Presentation only — no business logic lives here.
 */

interface CreationModalShellProps {
  title: string;
  /** Compact secondary metadata row (usage pills) rendered under the title */
  meta?: React.ReactNode;
  /** Sticky footer, typically the primary CTA */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const CreationModalShell = ({ title, meta, footer, children, className, bodyClassName }: CreationModalShellProps) => (
  <DialogContent
    className={cn(
      "p-0 gap-0 overflow-hidden rounded-lg w-[calc(100%-1.5rem)] sm:w-full max-w-[480px]",
      "max-h-[92dvh] flex flex-col",
      className
    )}
  >
    <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60 space-y-2 text-left">
      <DialogTitle className="text-base sm:text-lg font-semibold pr-8">{title}</DialogTitle>
      {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
    </DialogHeader>

    <div className={cn("flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6", bodyClassName)}>{children}</div>

    {footer && (
      <div className="px-5 py-4 border-t border-border/60 bg-background">{footer}</div>
    )}
  </DialogContent>
);

/** Compact secondary metadata pill */
export const UsagePill = ({
  icon,
  children,
  tone = "muted",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "accent" | "muted" | "warning";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      tone === "accent" && "bg-accent/10 border-accent/20 text-accent",
      tone === "warning" && "bg-destructive/10 border-destructive/20 text-destructive",
      tone === "muted" && "bg-muted/40 border-border text-muted-foreground"
    )}
  >
    {icon}
    <span>{children}</span>
  </span>
);

/** Primary section inside a creation modal */
export const CreationSection = ({
  title,
  description,
  children,
  variant = "primary",
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) => (
  <section className={cn("space-y-3", className)}>
    <div className="space-y-0.5">
      <h3
        className={cn(
          variant === "primary"
            ? "text-sm font-semibold text-foreground"
            : "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        )}
      >
        {title}
      </h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    {children}
  </section>
);

/** Field label with an optional, subdued "Optional" hint */
export const FieldLabel = ({
  htmlFor,
  children,
  optional,
  optionalLabel = "Optional",
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
  optionalLabel?: string;
}) => (
  <div className="flex items-baseline justify-between gap-2 mb-1.5">
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
    {optional && (
      <span className="text-[11px] text-muted-foreground/70 font-normal">{optionalLabel}</span>
    )}
  </div>
);
