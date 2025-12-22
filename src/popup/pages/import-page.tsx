import { useMemo, useState } from "react";
import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { importWallet } from "@/popup/api/import-wallet.ts";
import { importSecret } from "@/popup/api/import-secret.ts";
import { usePopup } from "@/popup/hooks/state.tsx";

type ImportMode = "mnemonic" | "secret";

function normalizeMnemonic(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function ImportPage() {
  const { actions } = usePopup();

  const [mode, setMode] = useState<ImportMode>("mnemonic");
  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!value.trim()) return false;
    return true;
  }, [value, submitting]);

  const onSubmit = async () => {
    setSubmitError(undefined);
    setDirty(true);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      if (mode === "mnemonic") {
        await importWallet({ mnemonic: normalizeMnemonic(value) });
      } else {
        await importSecret({ secret: value.trim() });
      }

      // Import handlers now set lastSelectedAccount to the newly imported key.
      await actions.refreshStatus();
      actions.goHome();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const validationError = useMemo(() => {
    if (!dirty) return undefined;
    if (!value.trim()) return "Required.";
    return undefined;
  }, [dirty, value]);

  return (
    <Shell>
      <Title>Import</Title>
      <Text size="sm">Import via mnemonic or secret key.</Text>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => setMode("mnemonic")}
          className={cn(
            "flex-1 rounded-md border border-primary px-2 py-2 text-sm",
            mode === "mnemonic" ? "text-primary" : "text-muted",
            "disabled:opacity-50"
          )}
        >
          Mnemonic
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => setMode("secret")}
          className={cn(
            "flex-1 rounded-md border border-primary px-2 py-2 text-sm",
            mode === "secret" ? "text-primary" : "text-muted",
            "disabled:opacity-50"
          )}
        >
          Secret
        </button>
      </div>

      <div className="mt-4">
        {mode === "mnemonic" ? (
          <textarea
            value={value}
            onChange={(e) => {
              setDirty(true);
              setValue(e.target.value);
            }}
            rows={3}
            placeholder="twelve words ..."
            className={cn(
              "w-full rounded-md border border-muted bg-background text-primary",
              "px-2 py-1 text-sm",
              "placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
            )}
          />
        ) : (
          <Input
            uiSize="md"
            value={value}
            onChange={(e) => {
              setDirty(true);
              setValue(e.target.value);
            }}
            placeholder="S..."
            autoComplete="off"
            spellCheck={false}
          />
        )}

        {validationError ? (
          <Text tone="error" size="sm">
            {validationError}
          </Text>
        ) : null}

        {submitError ? (
          <Text tone="error" size="sm">
            {submitError}
          </Text>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          disabled={submitting}
          onClick={() => {
            actions.goHome();
          }}
        >
          Back
        </Button>
        <Button disabled={!canSubmit} onClick={onSubmit}>
          Import
        </Button>
      </div>
    </Shell>
  );
}
