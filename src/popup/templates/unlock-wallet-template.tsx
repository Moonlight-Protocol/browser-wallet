import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { PasswordInput } from "@/popup/molecules/password-input.tsx";
import { Button } from "@/popup/atoms/button.tsx";

type Props = {
  password: string;
  passwordError?: string;
  submitError?: string;
  submitting: boolean;
  canSubmit: boolean;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
};

export function UnlockWalletTemplate(props: Props) {
  return (
    <Shell>
      <Title>Unlock</Title>
      <Text>Enter your password to unlock this wallet.</Text>

      <PasswordInput
        label="Password"
        value={props.password}
        autoComplete="current-password"
        onChange={props.onChangePassword}
        error={props.passwordError}
      />

      {props.submitError ? (
        <Text tone="error" size="sm">
          {props.submitError}
        </Text>
      ) : null}

      <Button
        type="button"
        disabled={!props.canSubmit}
        onClick={props.onSubmit}
      >
        Unlock
      </Button>
    </Shell>
  );
}
