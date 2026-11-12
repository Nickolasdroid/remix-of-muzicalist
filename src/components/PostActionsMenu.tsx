import { useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

export interface PostAction {
  /** Stable identifier for the action row */
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
}

interface PostActionsMenuProps {
  actions: PostAction[];
  disabled?: boolean;
  /** Controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible/sheet title override (defaults to "Post options") */
  title?: string;
}

/**
 * Single source of truth for the post three-dot menu.
 * Mobile → bottom sheet drawer, Desktop → dropdown. Used by both Feed and Dashboard
 * so the interaction pattern stays identical across the product.
 */
const PostActionsMenu = ({ actions, disabled, open, onOpenChange, title }: PostActionsMenuProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const menuTitle = title ?? t("dashboardPosts.postOptions", "Post options");
  // The tap/click that opens the menu must never also pick an option (on some phones
  // and when the list opens under the pointer, the same release landed on the first row)
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const openedAt = useRef(0);
  const setOpen = (v: boolean) => {
    if (v) openedAt.current = Date.now();
    if (open === undefined) setInnerOpen(v);
    onOpenChange?.(v);
  };
  const justOpened = () => Date.now() - openedAt.current < 400;

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full shrink-0"
      disabled={disabled}
      aria-label={menuTitle}
    >
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="rounded-t-xl">
          <DrawerTitle className="sr-only">{menuTitle}</DrawerTitle>
          <div className="flex flex-col gap-1 px-4 pb-8 pt-2">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  if (justOpened()) return;
                  setOpen(false);
                  action.onSelect();
                }}
                className={`flex items-center gap-3 w-full px-3 py-3.5 rounded-lg text-sm font-medium transition-colors ${
                  action.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-foreground/[0.07]"
                }`}
              >
                <action.icon className={`h-5 w-5 ${action.destructive ? "" : "text-muted-foreground"}`} />
                {action.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onSelect={(e) => {
              if (justOpened()) {
                e.preventDefault();
                return;
              }
              action.onSelect();
            }}
            className={action.destructive ? "text-destructive focus:text-destructive" : undefined}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostActionsMenu;
