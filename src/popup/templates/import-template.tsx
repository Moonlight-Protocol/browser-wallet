import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { IconDownload, IconKey, IconTextCaption } from "@tabler/icons-react";

type ImportMode = "mnemonic" | "secret";

export type ImportTemplateProps = {
  mode: ImportMode;
  submitting: boolean;
  value: string;

  canSubmit: boolean;
  validationError?: string;
  submitError?: string;

  onBack: () => void;
  onSelectMode: (mode: ImportMode) => void;
  onChangeValue: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function ImportTemplate(props: ImportTemplateProps) {
  return (
    <SubpageShell title="Import Wallet" onBack={props.onBack}>
      <div className="space-y-5">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)",
              border: "1px solid oklch(0.75 0.18 45 / 0.2)",
            }}
          >
            <IconDownload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs text-foreground/50">
            Import an existing wallet using your recovery phrase or secret key
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => props.onSelectMode("mnemonic")}
            disabled={props.submitting}
            className={cn(
              "flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50",
              props.mode === "mnemonic" ? "scale-[1.02]" : "hover:scale-[1.01]",
            )}
            style={{
              background: props.mode === "mnemonic"
                ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)"
                : "oklch(0.18 0.03 265 / 0.5)",
              border: props.mode === "mnemonic"
                ? "1px solid oklch(0.75 0.18 45 / 0.4)"
                : "1px solid oklch(1 0 0 / 0.06)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: props.mode === "mnemonic"
                  ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.3) 0%, oklch(0.65 0.16 40 / 0.2) 100%)"
                  : "oklch(0.2 0.03 265 / 0.5)",
                border: props.mode === "mnemonic"
                  ? "1px solid oklch(0.75 0.18 45 / 0.3)"
                  : "1px solid oklch(1 0 0 / 0.05)",
              }}
            >
              <IconTextCaption
                className={cn(
                  "h-5 w-5",
                  props.mode === "mnemonic"
                    ? "text-primary"
                    : "text-foreground/40",
                )}
              />
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-sm font-bold",
                  props.mode === "mnemonic"
                    ? "text-primary"
                    : "text-foreground/60",
                )}
              >
                Mnemonic
              </p>
              <p className="text-[10px] text-foreground/40">Recovery phrase</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => props.onSelectMode("secret")}
            disabled={props.submitting}
            className={cn(
              "flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50",
              props.mode === "secret" ? "scale-[1.02]" : "hover:scale-[1.01]",
            )}
            style={{
              background: props.mode === "secret"
                ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)"
                : "oklch(0.18 0.03 265 / 0.5)",
              border: props.mode === "secret"
                ? "1px solid oklch(0.75 0.18 45 / 0.4)"
                : "1px solid oklch(1 0 0 / 0.06)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: props.mode === "secret"
                  ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.3) 0%, oklch(0.65 0.16 40 / 0.2) 100%)"
                  : "oklch(0.2 0.03 265 / 0.5)",
                border: props.mode === "secret"
                  ? "1px solid oklch(0.75 0.18 45 / 0.3)"
                  : "1px solid oklch(1 0 0 / 0.05)",
              }}
            >
              <IconKey
                className={cn(
                  "h-5 w-5",
                  props.mode === "secret"
                    ? "text-primary"
                    : "text-foreground/40",
                )}
              />
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-sm font-bold",
                  props.mode === "secret"
                    ? "text-primary"
                    : "text-foreground/60",
                )}
              >
                Secret Key
              </p>
              <p className="text-[10px] text-foreground/40">Private key</p>
            </div>
          </button>
        </div>

        {/* Input Card */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: "oklch(0.15 0.03 265 / 0.5)",
            backdropFilter: "blur(12px)",
            border: "1px solid oklch(1 0 0 / 0.06)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.2)",
          }}
        >
          <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2">
            {props.mode === "mnemonic" ? "Recovery Phrase" : "Secret Key"}
          </label>

          {props.mode === "mnemonic"
            ? (
              <textarea
                value={props.value}
                onChange={(e) => props.onChangeValue(e.target.value)}
                rows={4}
                placeholder="Enter your 12 or 24 word recovery phrase..."
                disabled={props.submitting}
                className="w-full px-4 py-3 rounded-xl text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 resize-none"
              />
            )
            : (
              <input
                type="text"
                value={props.value}
                onChange={(e) => props.onChangeValue(e.target.value)}
                placeholder="S..."
                autoComplete="off"
                spellCheck={false}
                disabled={props.submitting}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
            )}

          <p className="text-[10px] text-foreground/40 mt-2">
            {props.mode === "mnemonic"
              ? "Enter each word separated by a space"
              : "Enter your Stellar secret key starting with 'S'"}
          </p>
        </div>

        {/* Error Messages */}
        {(props.validationError || props.submitError) && (
          <div
            className="p-4 rounded-xl text-sm font-medium"
            style={{
              background: "oklch(0.6 0.2 25 / 0.1)",
              border: "1px solid oklch(0.6 0.2 25 / 0.2)",
              color: "oklch(0.7 0.2 25)",
            }}
          >
            {props.validationError || props.submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          disabled={!props.canSubmit || props.submitting}
          onClick={props.onSubmit}
          className="w-full py-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.65 0.16 40) 100%)",
            color: "white",
            boxShadow: "0 4px 16px oklch(0.75 0.18 45 / 0.3)",
          }}
        >
          {props.submitting ? "Importing..." : "Import Wallet"}
        </button>
      </div>
    </SubpageShell>
  );
}
