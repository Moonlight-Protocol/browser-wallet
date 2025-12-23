import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { cn } from "@/popup/utils/cn.ts";

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
    <SubpageShell title="Import" onBack={props.onBack}>
      <Text size="sm">Import via mnemonic or secret key.</Text>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={props.submitting}
          onClick={() => props.onSelectMode("mnemonic")}
          className={cn(
            "flex-1 rounded-md border border-primary px-2 py-2 text-sm",
            props.mode === "mnemonic" ? "text-primary" : "text-muted",
            "disabled:opacity-50"
          )}
        >
          Mnemonic
        </button>
        <button
          type="button"
          disabled={props.submitting}
          onClick={() => props.onSelectMode("secret")}
          className={cn(
            "flex-1 rounded-md border border-primary px-2 py-2 text-sm",
            props.mode === "secret" ? "text-primary" : "text-muted",
            "disabled:opacity-50"
          )}
        >
          Secret
        </button>
      </div>

      <div className="mt-4">
        {props.mode === "mnemonic" ? (
          <textarea
            value={props.value}
            onChange={(e) => props.onChangeValue(e.target.value)}
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
            value={props.value}
            onChange={(e) => props.onChangeValue(e.target.value)}
            placeholder="S..."
            autoComplete="off"
            spellCheck={false}
          />
        )}

        {props.validationError ? (
          <Text tone="error" size="sm">
            {props.validationError}
          </Text>
        ) : null}

        {props.submitError ? (
          <Text tone="error" size="sm">
            {props.submitError}
          </Text>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          uiSize="sm"
          disabled={!props.canSubmit}
          onClick={props.onSubmit}
        >
          Import
        </Button>
      </div>
    </SubpageShell>
  );
}
