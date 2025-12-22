import { useEffect, useMemo, useState } from "react";
import { createWallet } from "@/popup/api/create-wallet.ts";
import { importWallet } from "@/popup/api/import-wallet.ts";
import { touch } from "@/popup/api/touch.ts";
import { usePopup } from "@/popup/hooks/state.tsx";
import {
  AddWalletTemplate,
  type AddWalletMode,
} from "@/popup/templates/add-wallet-template.tsx";
import { BackupPhraseTemplate } from "@/popup/templates/backup-phrase-template.tsx";
import { VerifyPhraseTemplate } from "@/popup/templates/verify-phrase-template.tsx";

type Step = AddWalletMode | "backup" | "verify";

function normalizeMnemonic(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function pickRandomIndices(count: number, maxExclusive: number): number[] {
  const out = new Set<number>();
  while (out.size < count) {
    out.add(Math.floor(Math.random() * maxExclusive));
  }
  return Array.from(out.values()).sort((a, b) => a - b);
}

export function AddWalletPage() {
  const { actions } = usePopup();

  // Keep the background session alive while the user is backing up/verifying.
  useEffect(() => {
    touch({ ttlMs: 30 * 60 * 1000 }).catch(() => undefined);
  }, []);

  const [step, setStep] = useState<Step>("choose");
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicDirty, setMnemonicDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const [generatedMnemonic, setGeneratedMnemonic] = useState<
    string | undefined
  >(undefined);
  const [hasCopied, setHasCopied] = useState(false);
  const [copyInfo, setCopyInfo] = useState<string | undefined>(undefined);

  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyValues, setVerifyValues] = useState<Record<number, string>>({});
  const [verifyDirty, setVerifyDirty] = useState<Record<number, boolean>>({});

  const mnemonicError = useMemo(() => {
    if (!mnemonicDirty) return undefined;
    if (!mnemonic.trim()) return "Mnemonic is required.";
    return undefined;
  }, [mnemonic, mnemonicDirty]);

  const onGenerate = async () => {
    setSubmitError(undefined);
    setSubmitting(true);
    try {
      await touch({ ttlMs: 30 * 60 * 1000 });
      const result = await createWallet();

      setGeneratedMnemonic(normalizeMnemonic(result.mnemonic));
      setHasCopied(false);
      setCopyInfo(undefined);
      setVerifyIndices([]);
      setVerifyValues({});
      setVerifyDirty({});

      // Do NOT refresh status yet; we want to force the backup + verify flow
      // before moving forward.
      setStep("backup");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onImport = async () => {
    setSubmitError(undefined);
    setMnemonicDirty(true);

    if (!mnemonic.trim()) return;

    setSubmitting(true);
    try {
      await importWallet({ mnemonic });
      await actions.refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const generatedWords = useMemo(() => {
    const m = generatedMnemonic ? normalizeMnemonic(generatedMnemonic) : "";
    return m ? m.split(" ") : [];
  }, [generatedMnemonic]);

  const verifyItems = useMemo(() => {
    return verifyIndices.map((index) => {
      const value = verifyValues[index] ?? "";
      const dirty = verifyDirty[index] ?? false;
      const expected = generatedWords[index] ?? "";
      const error =
        dirty && value.trim() && value.trim() !== expected
          ? "Incorrect word."
          : dirty && !value.trim()
          ? "Required."
          : undefined;

      return {
        index,
        value,
        error,
        onChange: (next: string) => {
          setVerifyDirty((prev) => ({ ...prev, [index]: true }));
          setVerifyValues((prev) => ({
            ...prev,
            [index]: normalizeMnemonic(next),
          }));
        },
      };
    });
  }, [verifyIndices, verifyValues, verifyDirty, generatedWords]);

  const canConfirmVerify = useMemo(() => {
    if (!hasCopied) return false;
    if (!generatedWords || generatedWords.length !== 12) return false;
    if (verifyIndices.length === 0) return false;

    return verifyIndices.every((index) => {
      const expected = generatedWords[index];
      const value = (verifyValues[index] ?? "").trim();
      return value.length > 0 && value === expected;
    });
  }, [hasCopied, generatedWords, verifyIndices, verifyValues]);

  if (step === "backup") {
    return (
      <BackupPhraseTemplate
        words={generatedWords}
        hasCopied={hasCopied}
        submitting={submitting}
        submitError={submitError}
        copyInfo={copyInfo}
        onClickCopy={async () => {
          setSubmitError(undefined);
          try {
            await touch({ ttlMs: 30 * 60 * 1000 });
            const text = generatedWords.join(" ");
            await navigator.clipboard.writeText(text);
            setHasCopied(true);
            setCopyInfo("Copied to clipboard.");
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSubmitError(message);
          }
        }}
        onClickConfirm={() => {
          setSubmitError(undefined);
          if (!hasCopied) return;
          if (generatedWords.length !== 12) {
            setSubmitError("Invalid mnemonic length.");
            return;
          }
          touch({ ttlMs: 30 * 60 * 1000 }).catch(() => undefined);
          const indices = pickRandomIndices(3, 12);
          setVerifyIndices(indices);
          setVerifyValues({});
          setVerifyDirty({});
          setStep("verify");
        }}
      />
    );
  }

  if (step === "verify") {
    return (
      <VerifyPhraseTemplate
        items={verifyItems}
        submitting={submitting}
        submitError={submitError}
        canConfirm={canConfirmVerify && !submitting}
        onClickConfirm={async () => {
          setSubmitError(undefined);
          // Mark all as dirty on submit attempt
          setVerifyDirty((prev) => {
            const next = { ...prev };
            for (const idx of verifyIndices) next[idx] = true;
            return next;
          });

          if (!canConfirmVerify) return;

          if (!generatedMnemonic) {
            setSubmitError("Missing generated phrase.");
            return;
          }

          setSubmitting(true);
          try {
            await touch({ ttlMs: 30 * 60 * 1000 });
            // Persist only after the user passes verification.
            await importWallet({ mnemonic: generatedMnemonic });
            await actions.refreshStatus();
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSubmitError(message);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    );
  }

  return (
    <AddWalletTemplate
      mode={step}
      mnemonic={mnemonic}
      mnemonicError={mnemonicError}
      submitting={submitting}
      submitError={submitError}
      onChangeMnemonic={(value) => {
        setMnemonicDirty(true);
        setMnemonic(value);
      }}
      onClickGenerate={onGenerate}
      onClickGoToImport={() => setStep("import")}
      onClickBack={() => setStep("choose")}
      onClickImport={onImport}
    />
  );
}
