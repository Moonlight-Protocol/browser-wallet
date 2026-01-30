import { useState } from "react";
import browser from "webextension-polyfill";
import { Button } from "@/popup/atoms/button.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { lock } from "@/popup/api/lock.ts";
import { usePopup } from "@/popup/hooks/state.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { DebugIcon } from "@/popup/icons/index.tsx";

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
      <Button
        variant="link"
        size="sm"
        type="button"
        aria-label="Debug"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "text-white hover:text-white",
          "px-0 h-auto cursor-pointer",
        )}
      >
        <DebugIcon className="w-8 h-8" />
      </Button>

      {open
        ? (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-background border border-muted rounded-lg shadow-lg min-w-[160px]">
            {error
              ? (
                <Text size="sm" tone="error" className="mt-0">
                  {error}
                </Text>
              )
              : null}

            <Button
              className="w-full"
              disabled={busy}
              onClick={onForceLock}
            >
              Lock wallet
            </Button>

            <Button className="mt-2 w-full" disabled={busy} onClick={onClear}>
              Clear storage
            </Button>
          </div>
        )
        : null}
    </div>
  );
}
