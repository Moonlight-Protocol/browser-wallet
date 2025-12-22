import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { cn } from "@/popup/utils/cn.ts";

export type AddWalletMode = "choose" | "import";

type Props = {
  mode: AddWalletMode;

  mnemonic: string;
  mnemonicError?: string;

  submitting: boolean;
  submitError?: string;

  onChangeMnemonic: (value: string) => void;

  onClickGenerate: () => void;
  onClickGoToImport: () => void;
  onClickBack: () => void;
  onClickImport: () => void;
};

export function AddWalletTemplate(props: Props) {
  if (props.mode === "import") {
    return (
      <Shell>
        <Title>Import wallet</Title>
        <Text size="sm">Paste your recovery phrase (mnemonic) below.</Text>

        <textarea
          value={props.mnemonic}
          onChange={(e) => props.onChangeMnemonic(e.target.value)}
          rows={3}
          placeholder="twelve words ..."
          className={cn(
            "mt-4 w-full rounded-md border border-muted bg-background text-primary",
            "px-2 py-1 text-sm",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
          )}
        />

        {props.mnemonicError ? (
          <Text tone="error" size="sm">
            {props.mnemonicError}
          </Text>
        ) : null}

        {props.submitError ? (
          <Text tone="error" size="sm">
            {props.submitError}
          </Text>
        ) : null}

        <div className="mt-4 flex gap-2">
          <Button disabled={props.submitting} onClick={props.onClickBack}>
            Back
          </Button>
          <Button
            disabled={props.submitting || Boolean(props.mnemonicError)}
            onClick={props.onClickImport}
          >
            Import
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Title>Add a wallet</Title>
      <Text size="sm">
        Your password encryption is set. Now add your first wallet.
      </Text>

      {props.submitError ? (
        <Text tone="error" size="sm">
          {props.submitError}
        </Text>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <Button disabled={props.submitting} onClick={props.onClickGenerate}>
          Generate wallet
        </Button>
        <Button disabled={props.submitting} onClick={props.onClickGoToImport}>
          Import wallet
        </Button>
      </div>
    </Shell>
  );
}
