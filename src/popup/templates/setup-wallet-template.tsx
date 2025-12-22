import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { PasswordInput } from "@/popup/molecules/password-input.tsx";
import { Button } from "@/popup/atoms/button.tsx";

type Props = {
  password: string;
  confirmPassword: string;
  passwordError?: string;
  confirmError?: string;
  submitError?: string;
  submitting: boolean;
  canSubmit: boolean;
  onChangePassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
  onSubmit: () => void;
};

export function SetupWalletTemplate(props: Props) {
  return (
    <Shell>
      <Title>Create your password</Title>
      <Text>
        This password encrypts your wallet data on this device. You’ll need it
        to unlock the wallet.
      </Text>

      <PasswordInput
        label="Password"
        value={props.password}
        autoComplete="new-password"
        onChange={props.onChangePassword}
        error={props.passwordError}
      />

      <PasswordInput
        label="Confirm password"
        value={props.confirmPassword}
        autoComplete="new-password"
        onChange={props.onChangeConfirmPassword}
        error={props.confirmError}
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
        Confirm
      </Button>
    </Shell>
  );
}
