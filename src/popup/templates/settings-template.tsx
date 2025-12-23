import { useMemo } from "react";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { networkLabel } from "@/popup/utils/common.ts";

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
  const selectedNetworkLabel = useMemo(
    () =>
      networkLabel({
        network: props.selectedNetwork,
        customNetworkName: props.customNetworkName,
      }),
    [props.customNetworkName, props.selectedNetwork]
  );

  return (
    <SubpageShell title="Settings" onBack={props.onBack}>
      <Text size="sm">Network: {selectedNetworkLabel}</Text>

      {props.error ? (
        <Text tone="error" size="sm">
          {props.error}
        </Text>
      ) : null}

      <div className="mt-3">
        <div className="text-xs text-muted">Network</div>
        <div className="mt-2 flex flex-col gap-2">
          {props.networkItems.map((item) => {
            if (item.key === "custom") {
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled
                  className={cn(
                    "text-left rounded-md border border-primary px-3 py-2 text-sm",
                    "text-muted opacity-50"
                  )}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                disabled={props.busy}
                onClick={() => props.onSelectNetwork(item.key)}
                className={cn(
                  "text-left rounded-md border border-primary px-3 py-2 text-sm",
                  props.selectedNetwork === item.key
                    ? "text-primary"
                    : "text-muted",
                  "disabled:opacity-50"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </SubpageShell>
  );
}
