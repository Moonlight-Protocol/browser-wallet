import { useState } from "react";
import browser from "webextension-polyfill";
import { Button } from "@/popup/atoms/button.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { lock } from "@/popup/api/lock.ts";
import { usePopup } from "@/popup/hooks/state.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { DebugIcon } from "@/popup/icons/index.tsx";
import { IconLock, IconTrash, IconX } from "@tabler/icons-react";

export function DevDebug() {
  const { actions } = usePopup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const onForceLock = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await lock();
      await actions.refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const onClear = async () => {
    setError(undefined);
    setBusy(true);
    try {
      // Best-effort: stop any unlocked session first.
      await lock().catch(() => undefined);
      await browser.storage.local.clear();

      // Fully reload the extension so background stores reset too.
      browser.runtime.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-20">
      {/* Debug toggle button */}
      <button
        type="button"
        aria-label="Debug menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer",
          "transition-all duration-300 ease-out",
          "hover:scale-105 active:scale-95",
          open
            ? "bg-primary/20 border border-primary/30"
            : "bg-card/60 border border-border/50 hover:border-primary/30",
        )}
        style={{
          backdropFilter: "blur(8px)",
          boxShadow: open
            ? "0 0 20px oklch(0.75 0.18 45 / 0.3)"
            : "0 4px 12px oklch(0 0 0 / 0.2)",
        }}
      >
        <DebugIcon
          className={cn(
            "w-5 h-5 transition-all duration-300",
            open
              ? "text-primary"
              : "text-foreground/60 group-hover:text-primary",
          )}
        />
        {/* Pulse indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
      </button>

      {/* Debug panel */}
      {open && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-3 min-w-[220px]",
            "rounded-2xl overflow-hidden",
            "animate-fade-in-up",
          )}
          style={{
            background: "oklch(0.14 0.035 265 / 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid oklch(1 0 0 / 0.1)",
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(1 0 0 / 0.05) inset",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 8px oklch(0.75 0.18 45 / 0.6)" }}
              />
              <span className="text-sm font-semibold text-foreground">
                Developer Tools
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {error && (
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "oklch(0.5 0.2 25 / 0.15)",
                  border: "1px solid oklch(0.6 0.2 25 / 0.3)",
                }}
              >
                <Text size="sm" tone="error" className="m-0">
                  {error}
                </Text>
              </div>
            )}

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 px-3",
                "hover:bg-foreground/5 rounded-xl",
                "text-foreground/80 hover:text-foreground",
                "transition-all duration-200",
              )}
              disabled={busy}
              onClick={onForceLock}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "oklch(0.55 0.20 300 / 0.15)",
                  border: "1px solid oklch(0.55 0.20 300 / 0.2)",
                }}
              >
                <IconLock className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Lock Wallet</span>
                <span className="text-xs text-foreground/40">
                  Force lock session
                </span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 px-3",
                "hover:bg-destructive/10 rounded-xl",
                "text-foreground/80 hover:text-destructive",
                "transition-all duration-200",
              )}
              disabled={busy}
              onClick={onClear}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "oklch(0.6 0.2 25 / 0.15)",
                  border: "1px solid oklch(0.6 0.2 25 / 0.2)",
                }}
              >
                <IconTrash className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Clear Storage</span>
                <span className="text-xs text-foreground/40">
                  Reset all data
                </span>
              </div>
            </Button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/20">
            <span className="text-xs text-foreground/30">
              Development mode only
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
