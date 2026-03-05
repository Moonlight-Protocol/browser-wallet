import { useEffect, useState } from "react";
import { unlock } from "@/popup/api/unlock.ts";
import { usePopup } from "@/popup/hooks/state.tsx";
import { UnlockWalletTemplate } from "@/popup/templates/unlock-wallet-template.tsx";

declare const __SEED_PASSWORD__: string;

export function UnlockWalletPage() {
  const { actions } = usePopup();

  const [password, setPassword] = useState("");
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // Auto-unlock with seed password if available
  useEffect(() => {
    if (!__SEED_PASSWORD__) return;
    let cancelled = false;
    (async () => {
      setSubmitting(true);
      try {
        await unlock({ password: __SEED_PASSWORD__ });
        if (!cancelled) await actions.refreshStatus();
      } catch {
        // Fall through to manual unlock
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const passwordError = (() => {
    if (!passwordDirty) return undefined;
    if (!password) return "Password is required.";
    return undefined;
  })();

  const canSubmit = password.length > 0 && !submitting;

  const onSubmit = async () => {
    setSubmitError(undefined);
    setPasswordDirty(true);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await unlock({ password });
      await actions.refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UnlockWalletTemplate
      password={password}
      passwordError={passwordError}
      submitError={submitError}
      submitting={submitting}
      canSubmit={canSubmit}
      onChangePassword={(value) => {
        setPasswordDirty(true);
        setPassword(value);
      }}
      onSubmit={onSubmit}
    />
  );
}
