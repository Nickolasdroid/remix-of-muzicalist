import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";

export interface ConfirmActionConfig {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  successMessage?: string;
  errorMessage?: string;
}

export interface UseConfirmActionResult {
  open: boolean;
  config: ConfirmActionConfig | null;
  loading: boolean;
  request: (config: ConfirmActionConfig, action: () => void | Promise<void>) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
  setOpen: (open: boolean) => void;
}

/**
 * Two-step confirm pattern: `request()` opens the dialog with a config + action.
 * `confirm()` runs the action, surfaces toast messages, and closes the dialog.
 */
export function useConfirmAction(): UseConfirmActionResult {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmActionConfig | null>(null);
  const [action, setAction] = useState<(() => void | Promise<void>) | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    (cfg: ConfirmActionConfig, run: () => void | Promise<void>) => {
      setConfig(cfg);
      setAction(() => run);
      setOpen(true);
    },
    [],
  );

  const cancel = useCallback(() => {
    setOpen(false);
    setAction(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!action) return;
    setLoading(true);
    try {
      await action();
      if (config?.successMessage) {
        toast({ title: config.successMessage });
      }
      setOpen(false);
      setAction(null);
    } catch (err) {
      toast({
        title: config?.errorMessage ?? "Action failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [action, config]);

  return { open, config, loading, request, cancel, confirm, setOpen };
}
