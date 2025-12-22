import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { MnemonicWords } from "@/popup/molecules/mnemonic-words.tsx";

type Props = {
  words: string[];
  hasCopied: boolean;
  submitting: boolean;
  submitError?: string;
  copyInfo?: string;

  onClickCopy: () => void;
  onClickConfirm: () => void;
};

export function BackupPhraseTemplate(props: Props) {
  return (
    <Shell>
      <Title>Backup phrase</Title>
      <Text size="sm">
        Write these 12 words down in order. Anyone with this phrase can access
        your wallet.
      </Text>

      <MnemonicWords words={props.words} />

      {props.copyInfo ? (
        <Text tone="muted" size="sm">
          {props.copyInfo}
        </Text>
      ) : null}

      {props.submitError ? (
        <Text tone="error" size="sm">
          {props.submitError}
        </Text>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full py-3"
          disabled={props.submitting}
          onClick={props.onClickCopy}
        >
          Copy
        </Button>
        <Button
          className="w-full"
          disabled={!props.hasCopied || props.submitting}
          onClick={props.onClickConfirm}
        >
          I wrote it down
        </Button>
      </div>
    </Shell>
  );
}
