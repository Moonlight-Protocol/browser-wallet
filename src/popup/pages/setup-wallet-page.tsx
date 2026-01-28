import { useState } from "react";
import { unlock } from "@/popup/api/unlock.ts";
import { usePopup } from "@/popup/hooks/state.tsx";
import { SetupWalletTemplate } from "@/popup/templates/setup-wallet-template.tsx";

export function SetupWalletPage() {
  const { actions } = usePopup();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [confirmDirty, setConfirmDirty] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const passwordError = (() => {
    if (!passwordDirty) return undefined;
    if (!password) return "Password is required.";
    return undefined;
  })();

  const confirmError = (() => {
    if (!confirmDirty) return undefined;
    if (!confirmPassword) return "Please confirm your password.";
    if (password && confirmPassword && password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return undefined;
  })();

  const canSubmit = password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    !submitting;

  const onSubmit = async () => {
    setSubmitError(undefined);

    setPasswordDirty(true);
    setConfirmDirty(true);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // Give onboarding enough time for backup + verification.
      await unlock({ password, ttlMs: 30 * 60 * 1000 });
      await actions.refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SetupWalletTemplate
      password={password}
      confirmPassword={confirmPassword}
      passwordError={passwordError}
      confirmError={confirmError}
      submitError={submitError}
      submitting={submitting}
      canSubmit={canSubmit}
      onChangePassword={(value) => {
        setPasswordDirty(true);
        setPassword(value);
      }}
      onChangeConfirmPassword={(value) => {
        setConfirmDirty(true);
        setConfirmPassword(value);
      }}
      onSubmit={onSubmit}
    />
  );
}
