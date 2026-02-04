import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { cn } from "@/popup/utils/cn.ts";
import {
  IconCheck,
  IconNetwork,
  IconSettings,
  IconWorld,
} from "@tabler/icons-react";

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
    network: Exclude<Network, "custom">,
  ) => void | Promise<void>;
};

const networkIcons: Record<Network, typeof IconWorld> = {
  mainnet: IconWorld,
  testnet: IconNetwork,
  futurenet: IconNetwork,
  custom: IconNetwork,
};

export function SettingsTemplate(props: SettingsTemplateProps) {
  return (
    <SubpageShell title="Settings" onBack={props.onBack}>
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)",
              border: "1px solid oklch(0.75 0.18 45 / 0.2)",
            }}
          >
            <IconSettings className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs text-foreground/50">
            Configure your wallet preferences
          </p>
        </div>

        {/* Network Configuration Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <IconWorld className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
              Network Configuration
            </h3>
          </div>

          <div
            className="p-4 rounded-2xl space-y-2"
            style={{
              background: "oklch(0.15 0.03 265 / 0.5)",
              backdropFilter: "blur(12px)",
              border: "1px solid oklch(1 0 0 / 0.06)",
              boxShadow: "0 4px 24px oklch(0 0 0 / 0.2)",
            }}
          >
            {props.networkItems.map((item) => {
              const isSelected = props.selectedNetwork === item.key;
              const Icon = networkIcons[item.key];

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (!item.disabled && item.key !== "custom") {
                      props.onSelectNetwork(
                        item.key as Exclude<Network, "custom">,
                      );
                    }
                  }}
                  disabled={item.disabled || props.busy}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                    item.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                    isSelected && !item.disabled && "scale-[1.01]",
                  )}
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)"
                      : "oklch(0.18 0.03 265 / 0.4)",
                    border: isSelected
                      ? "1px solid oklch(0.75 0.18 45 / 0.4)"
                      : "1px solid oklch(1 0 0 / 0.04)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.3) 0%, oklch(0.65 0.16 40 / 0.2) 100%)"
                        : "oklch(0.2 0.03 265 / 0.5)",
                      border: isSelected
                        ? "1px solid oklch(0.75 0.18 45 / 0.3)"
                        : "1px solid oklch(1 0 0 / 0.05)",
                    }}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "text-primary" : "text-foreground/40",
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isSelected ? "text-primary" : "text-foreground/70",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-foreground/40">
                      {item.key === "mainnet" && "Production network"}
                      {item.key === "testnet" && "Testing network"}
                      {item.key === "futurenet" && "Experimental network"}
                      {item.key === "custom" &&
                        (props.customNetworkName || "Custom configuration")}
                    </p>
                  </div>

                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.65 0.16 40) 100%)",
                        boxShadow: "0 2px 8px oklch(0.75 0.18 45 / 0.4)",
                      }}
                    >
                      <IconCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Error Message */}
        {props.error && (
          <div
            className="p-4 rounded-xl text-sm font-medium"
            style={{
              background: "oklch(0.6 0.2 25 / 0.1)",
              border: "1px solid oklch(0.6 0.2 25 / 0.2)",
              color: "oklch(0.7 0.2 25)",
            }}
          >
            {props.error}
          </div>
        )}

        {/* Version Info */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-foreground/30">
            Moonlight Wallet
          </p>
        </div>
      </div>
    </SubpageShell>
  );
}
