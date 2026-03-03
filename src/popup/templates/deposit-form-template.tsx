import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/popup/atoms/dropdown-menu.tsx";
import { ChevronDownIcon } from "@/popup/icons/index.tsx";
import {
  IconArrowDownToArc,
  IconArrowRampRight2,
  IconServer,
} from "@tabler/icons-react";
import type {
  DepositMethod,
  EntropyLevel,
} from "@/background/handlers/private/deposit.types.ts";
import type { PrivacyProvider } from "@/persistence/stores/private-channels.types.ts";

export type DepositFormTemplateProps = {
  channelName: string;
  provider: PrivacyProvider | undefined;
  method: DepositMethod;
  setMethod: (method: DepositMethod) => void;
  amount: string;
  setAmount: (amount: string) => void;
  entropyLevel: EntropyLevel;
  setEntropyLevel: (level: EntropyLevel) => void;
  availableBalance?: string;
  maxAmount?: string;
  busy: boolean;
  error?: string;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
};

const ENTROPY_LABELS: Record<EntropyLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  V_HIGH: "V.High",
};

export function DepositFormTemplate(props: DepositFormTemplateProps) {
  const entropyLevels: EntropyLevel[] = ["LOW", "MEDIUM", "HIGH", "V_HIGH"];

  return (
    <SubpageShell title="Ramp" onBack={props.onBack}>
      <div className="space-y-4">
        {/* Channel Name */}
        <div className="text-sm text-muted-foreground mb-2">
          {props.channelName}
        </div>

        {/* Provider Section */}
        {props.provider && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <IconServer className="h-5 w-5 text-primary" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-xs font-medium uppercase text-muted-foreground">
                    Provider
                  </Text>
                  <Text className="font-medium truncate">
                    {props.provider.name}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Deposit/Withdraw */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            disabled={props.busy}
          >
            <IconArrowDownToArc className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled
          >
            <IconArrowRampRight2 className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>

        {/* Method Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">
                Method
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={props.method === "DIRECT" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => props.setMethod("DIRECT")}
                  disabled={props.busy}
                >
                  Direct
                </Button>
                <Button
                  variant={props.method === "3RD-PARTY RAMP"
                    ? "default"
                    : "outline"}
                  className="flex-1"
                  onClick={() => props.setMethod("3RD-PARTY RAMP")}
                  disabled
                >
                  3rd-party Ramp
                </Button>
              </div>
            </div>

            {/* Amount Input */}
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
                  className="flex-1"
                />
                <Text className="text-sm text-muted-foreground whitespace-nowrap">
                  XLM
                </Text>
              </div>
              {props.maxAmount && (
                <Text className="text-xs text-muted-foreground">
                  Maximum: {props.maxAmount} XLM
                </Text>
              )}
              {props.availableBalance && (
                <Text className="text-xs text-muted-foreground">
                  Available public balance: {props.availableBalance} XLM
                </Text>
              )}
            </div>

            {/* Entropy Selection */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">
                Entropy
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={props.busy}
                  >
                    <span>{ENTROPY_LABELS[props.entropyLevel]}</span>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuRadioGroup
                    value={props.entropyLevel}
                    onValueChange={(value) => {
                      if (value) {
                        props.setEntropyLevel(value as EntropyLevel);
                      }
                    }}
                  >
                    {entropyLevels.map((level) => (
                      <DropdownMenuRadioItem
                        key={level}
                        value={level}
                        disabled={props.busy}
                      >
                        {ENTROPY_LABELS[level]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Text className="text-xs text-muted-foreground">
                Higher entropy = Increased privacy
              </Text>
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
            Review Transaction
          </Button>
        </CardFooter>
      </div>
    </SubpageShell>
  );
}
