import { Shell } from "@/popup/templates/shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Textarea } from "@/popup/atoms/textarea.tsx";
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
        <Card className="shadow-sm border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Import wallet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste your recovery phrase (mnemonic) below.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="mnemonic">Recovery phrase</Label>
              <Textarea
                id="mnemonic"
                value={props.mnemonic}
                onChange={(e) => props.onChangeMnemonic(e.target.value)}
                rows={3}
                placeholder="twelve words ..."
                spellCheck={false}
                className="font-mono text-sm"
              />
              {props.mnemonicError ? (
                <p className="text-sm text-destructive">
                  {props.mnemonicError}
                </p>
              ) : null}
            </div>

            {props.submitError ? (
              <p className="text-sm text-destructive">{props.submitError}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={props.submitting}
              onClick={props.onClickBack}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={props.submitting || Boolean(props.mnemonicError)}
              onClick={props.onClickImport}
            >
              Import
            </Button>
          </CardFooter>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Add a wallet</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your password is set. Create a new wallet or import an existing one.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.submitError ? (
            <p className="text-sm text-destructive">{props.submitError}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={props.submitting}
            onClick={props.onClickGenerate}
          >
            Generate wallet
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            disabled={props.submitting}
            onClick={props.onClickGoToImport}
          >
            Import wallet
          </Button>
        </CardFooter>
      </Card>
    </Shell>
  );
}
