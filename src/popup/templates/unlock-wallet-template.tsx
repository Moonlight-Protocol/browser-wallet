import { Background } from "@/popup/atoms/background.tsx";
import { Container } from "@/popup/atoms/container.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { PasswordInput } from "@/popup/molecules/password-input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { DEV } from "@/common/dev-flag.ts";
import { DevDebug } from "@/popup/organisms/dev-debug.tsx";
import { MoonlightBackground } from "@/popup/atoms/moonlight-background.tsx";

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
    <Background>
      <MoonlightBackground>
        <Container>
          <div className="relative flex-1 flex flex-col items-center z-10">
            <div className="w-full pt-64 flex flex-col items-center">
              <div className="text-center">
                <Title className="text-4xl font-bold tracking-tight">
                  Moonlight
                </Title>
                <Title className="text-4xl font-bold tracking-tight -mt-2">
                  Wallet
                </Title>
              </div>
            </div>

            <form
              className="flex-1 w-full flex flex-col items-center mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit();
              }}
            >
              <div className="w-full max-w-sm p-1">
                <PasswordInput
                  placeholder="Enter your password"
                  value={props.password}
                  autoComplete="current-password"
                  onChange={props.onChangePassword}
                  error={props.passwordError}
                />

                {props.submitError
                  ? (
                    <Text tone="error" size="sm" className="mt-3">
                      {props.submitError}
                    </Text>
                  )
                  : null}

                <Button
                  type="submit"
                  disabled={!props.canSubmit}
                  className="mt-4 w-full"
                >
                  Unlock
                </Button>
              </div>
            </form>
          </div>
          {DEV ? <DevDebug /> : null}
        </Container>
      </MoonlightBackground>
    </Background>
  );
}
