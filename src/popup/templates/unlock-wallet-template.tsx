import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { PasswordInput } from "@/popup/molecules/password-input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { MasterWalletIcon } from "@/popup/icons/master-wallet-icon.tsx";

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
      <div className="min-h-full flex flex-col items-center">
        <div className="w-full pt-6 flex flex-col items-center">
          <div className="text-center">
            <Title>Moonlight Wallet</Title>
          </div>

          <Text className="mt-2 text-center">
            Enter your password to unlock.
          </Text>
        </div>

        <form
          className="flex-1 w-full flex flex-col items-center justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmit();
          }}
        >
          <div className="w-full max-w-sm">
            <PasswordInput
              label="Password"
              value={props.password}
              autoComplete="current-password"
              onChange={props.onChangePassword}
              error={props.passwordError}
            />

            {props.submitError ? (
              <Text tone="error" size="sm" className="mt-3">
                {props.submitError}
              </Text>
            ) : null}

            <Button
              type="submit"
              disabled={!props.canSubmit}
              className="mt-4 w-full"
            >
              Unlock
            </Button>
          </div>
        </form>

        <div className="w-full flex items-center justify-center pb-2">
          <MasterWalletIcon className="h-16 w-16 text-muted" />
        </div>
      </div>
    </Shell>
  );
}
