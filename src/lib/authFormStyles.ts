/**
 * Shared form control styling for Muzicalist authentication and
 * registration pages (Login, User Registration, Artist Registration).
 * Reference: Artist Registration Step 1 input dimensions.
 */
export const authInputBase =
  "bg-input border-border focus:border-accent h-9";
export const authInputWithIcon = `${authInputBase} pl-9`;
export const authInputWithIconAndToggle = `${authInputBase} pl-9 pr-10`;
export const authInputIconClass =
  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none";
export const authInputToggleClass =
  "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors";
export const authInputToggleIconSize = "h-4 w-4";
