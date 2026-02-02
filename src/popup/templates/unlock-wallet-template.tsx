import { Background } from "@/popup/atoms/background.tsx";
import { Container } from "@/popup/atoms/container.tsx";
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
          <div className="relative flex-1 flex flex-col items-center z-10 px-6">
            {/* Title section */}
            <div className="w-full pt-52 flex flex-col items-center animate-fade-in-up">
              <div className="text-center space-y-1">
                <h1 className="text-5xl font-extrabold tracking-tight text-gradient-moonlight">
                  Moonlight
                </h1>
                <p className="text-lg font-medium text-foreground/70 tracking-wide uppercase">
                  Wallet
                </p>
              </div>

              {/* Decorative line */}
              <div className="mt-3 w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            {/* Form section */}
            <form
              className="flex-1 w-full flex flex-col items-center mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit();
              }}
              style={{ animationDelay: "0.2s" }}
            >
              <div
                className="w-full max-w-sm animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                {/* Input area */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "oklch(0.15 0.03 265 / 0.6)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                    boxShadow:
                      "0 8px 32px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)",
                  }}
                >
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
                    loading={props.submitting}
                    className="mt-5 w-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.65 0.16 40) 100%)",
                      boxShadow: "0 4px 20px oklch(0.75 0.18 45 / 0.4)",
                    }}
                    size="lg"
                  >
                    Unlock Wallet
                  </Button>
                </div>

                {/* Forgot password link */}
                <button
                  type="button"
                  className="mt-5 text-center w-full text-sm font-medium text-foreground/60 hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
            <div
              className="pb-4 text-center animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <p className="text-xs text-foreground/30 tracking-wider">
                Secure Stellar Wallet
              </p>
            </div>
          </div>
          {DEV ? <DevDebug /> : null}
        </Container>
      </MoonlightBackground>
    </Background>
  );
}
