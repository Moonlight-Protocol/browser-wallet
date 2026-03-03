import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { IconInfoCircle } from "@tabler/icons-react";
import type { PrivacyProvider } from "@/persistence/stores/private-channels.types.ts";

export type ReceiveFormTemplateProps = {
  channelName: string;
  assetCode: string;
  accountName?: string;
  provider: PrivacyProvider | undefined;
  amount: string;
  setAmount: (amount: string) => void;
  maxAmount?: string;
  busy: boolean;
  error?: string;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
};

export function ReceiveFormTemplate(props: ReceiveFormTemplateProps) {
  return (
    <SubpageShell title="Receive Funds" onBack={props.onBack}>
      <div className="space-y-4">
        {/* Account/Channel/Asset Info */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {props.accountName && (
              <div className="flex justify-between items-center">
                <Text className="text-xs font-medium uppercase text-muted-foreground">
                  Account
                </Text>
                <Text className="text-sm font-medium">{props.accountName}</Text>
              </div>
            )}
            <div className="flex justify-between items-center">
              <Text className="text-xs font-medium uppercase text-muted-foreground">
                Channel
              </Text>
              <Text className="text-sm font-medium">{props.channelName}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-xs font-medium uppercase text-muted-foreground">
                Asset
              </Text>
              <Text className="text-sm font-medium">{props.assetCode}</Text>
            </div>
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-xs uppercase text-muted-foreground"
              >
                Amount
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  min="0"
                  value={props.amount}
                  onChange={(e) => props.setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={props.busy}
                  className="flex-1 text-lg"
                />
                <Text className="text-sm text-muted-foreground whitespace-nowrap">
                  {props.assetCode}
                </Text>
              </div>
              {props.maxAmount && (
                <Text className="text-xs text-muted-foreground">
                  Maximum: {props.maxAmount} {props.assetCode}
                </Text>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Text className="text-sm font-semibold">How it works</Text>
                <Text className="text-xs text-muted-foreground">
                  We&apos;ll create 5 UTXOs and generate a receiving address.
                  Share this address with the sender to receive funds privately.
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {props.error
          ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {props.error}
            </div>
          )
          : null}

        <CardFooter className="px-0">
          <Button
            className="w-full"
            disabled={props.busy || !props.canSubmit}
            onClick={() => props.onSubmit()}
            loading={props.busy}
          >
            Generate Receiving Address
          </Button>
        </CardFooter>
      </div>
    </SubpageShell>
  );
}
