import { Shell } from "@/popup/templates/shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
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
      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Backup phrase</CardTitle>
          <p className="text-sm text-muted-foreground">
            Write these 12 words down in order. Anyone with this phrase can
            access your wallet.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <MnemonicWords words={props.words} />
          {props.copyInfo ? (
            <p className="text-sm text-muted-foreground">{props.copyInfo}</p>
          ) : null}
          {props.submitError ? (
            <p className="text-sm text-destructive">{props.submitError}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
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
        </CardFooter>
      </Card>
    </Shell>
  );
}
