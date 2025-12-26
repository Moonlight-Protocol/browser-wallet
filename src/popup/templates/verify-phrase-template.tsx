import { Shell } from "@/popup/templates/shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
import { Label } from "@/popup/atoms/label.tsx";

type VerifyItem = {
  index: number; // 0-based
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

type Props = {
  items: VerifyItem[];
  submitting: boolean;
  submitError?: string;
  canConfirm: boolean;
  onClickConfirm: () => void;
};

export function VerifyPhraseTemplate(props: Props) {
  return (
    <Shell>
      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Confirm your phrase</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the requested words to continue.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.items.map((item) => (
            <div key={item.index} className="space-y-1">
              <Label
                htmlFor={`word-${item.index}`}
                className="text-xs uppercase tracking-wide"
              >
                Word #{item.index + 1}
              </Label>
              <Input
                id={`word-${item.index}`}
                uiSize="sm"
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                placeholder="word"
                autoComplete="off"
                spellCheck={false}
              />
              {item.error ? (
                <p className="text-sm text-destructive">{item.error}</p>
              ) : null}
            </div>
          ))}

          {props.submitError ? (
            <p className="text-sm text-destructive">{props.submitError}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={!props.canConfirm || props.submitting}
            onClick={props.onClickConfirm}
          >
            Confirm
          </Button>
        </CardFooter>
      </Card>
    </Shell>
  );
}
