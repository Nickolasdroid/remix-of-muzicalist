import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
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
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

export interface PostAction {
  /** Stable identifier for the action row */
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

interface PostActionsMenuProps {
  actions: PostAction[];
  disabled?: boolean;
  /** Controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Single source of truth for the post three-dot menu.
 * Mobile → bottom sheet drawer, Desktop → dropdown. Used by both Feed and Dashboard
 * so the interaction pattern stays identical across the product.
 */
const PostActionsMenu = ({ actions, disabled, open, onOpenChange }: PostActionsMenuProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full shrink-0"
      disabled={disabled}
      aria-label={t("dashboardPosts.postOptions", "Post options")}
    >
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="rounded-t-xl">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base font-semibold">
              {t("dashboardPosts.postOptions", "Post options")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-4 pb-8">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  onOpenChange?.(false);
                  action.onSelect();
                }}
                className={`flex items-center gap-3 w-full px-3 py-3.5 rounded-lg text-sm font-medium transition-colors ${
                  action.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-accent/10"
                }`}
              >
                <span className={action.destructive ? "" : "text-accent"}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onSelect}
            className={action.destructive ? "text-destructive focus:text-destructive" : undefined}
          >
            <span className="mr-2 inline-flex">{action.icon}</span>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostActionsMenu;
