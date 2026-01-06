import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { RadioGroup, RadioGroupItem } from "@/popup/atoms/radio-group.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent } from "@/popup/atoms/card.tsx";
import { cn } from "@/popup/utils/cn.ts";

type Network = "mainnet" | "testnet" | "futurenet" | "custom";

type NetworkItem = {
  key: Network;
  label: string;
  disabled: boolean;
};

export type SettingsTemplateProps = {
  selectedNetwork: Network;
  customNetworkName?: string;
  networkItems: NetworkItem[];
  busy: boolean;
  error?: string;
  onBack: () => void;
  onSelectNetwork: (
    network: Exclude<Network, "custom">
  ) => void | Promise<void>;
};

export function SettingsTemplate(props: SettingsTemplateProps) {
  return (
    <SubpageShell title="Settings" onBack={props.onBack}>
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Network Configuration
          </h3>
          <Card>
            <CardContent className="pt-6">
              <RadioGroup
                value={props.selectedNetwork}
                onValueChange={(v) =>
                  props.onSelectNetwork(v as Exclude<Network, "custom">)
                }
                disabled={props.busy}
              >
                {props.networkItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center space-x-3 space-y-0"
                  >
                    <RadioGroupItem
                      value={item.key}
                      id={item.key}
                      disabled={item.disabled}
                    />
                    <Label
                      htmlFor={item.key}
                      className={cn(
                        "cursor-pointer font-normal",
                        item.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {item.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </section>

        {props.error ? (
          <Text tone="error" size="sm" className="mt-2">
            {props.error}
          </Text>
        ) : null}
      </div>
    </SubpageShell>
  );
}
