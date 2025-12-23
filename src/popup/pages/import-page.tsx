import { useMemo, useState } from "react";
import { ImportTemplate } from "@/popup/templates/import-template.tsx";
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
    <ImportTemplate
      mode={mode}
      submitting={submitting}
      value={value}
      canSubmit={canSubmit}
      validationError={validationError}
      submitError={submitError}
      onBack={() => {
        actions.goHome();
      }}
      onSelectMode={(nextMode) => setMode(nextMode)}
      onChangeValue={(nextValue) => {
        setDirty(true);
        setValue(nextValue);
      }}
      onSubmit={onSubmit}
    />
  );
}
