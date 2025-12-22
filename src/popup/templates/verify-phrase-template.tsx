import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";

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
      <Title>Confirm your phrase</Title>
      <Text size="sm">Enter the requested words to continue.</Text>

      {props.items.map((item) => (
        <div key={item.index} className="mt-4">
          <Text size="sm" tone="muted" className="mt-0">
            Word #{item.index + 1}
          </Text>
          <Input
            uiSize="sm"
            value={item.value}
            onChange={(e) => item.onChange(e.target.value)}
            placeholder="word"
            autoComplete="off"
            spellCheck={false}
          />
          {item.error ? (
            <Text tone="error" size="sm">
              {item.error}
            </Text>
          ) : null}
        </div>
      ))}

      {props.submitError ? (
        <Text tone="error" size="sm">
          {props.submitError}
        </Text>
      ) : null}

      <Button
        className="mt-4 w-full"
        disabled={!props.canConfirm || props.submitting}
        onClick={props.onClickConfirm}
      >
        Confirm
      </Button>
    </Shell>
  );
}
