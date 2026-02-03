import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { IconHash, IconShieldLock } from "@tabler/icons-react";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateAddChannelTemplateProps = {
  network: ChainNetwork;
  setNetwork: (v: ChainNetwork) => void;

  name: string;
  setName: (v: string) => void;

  contractId: string;
  setContractId: (v: string) => void;

  assetCode: string;
  setAssetCode: (v: string) => void;

  assetIssuer: string;
  setAssetIssuer: (v: string) => void;

  isNativeXlm: boolean;

  busy: boolean;
  error?: string;
  canSubmit: boolean;

  onBack: () => void;
  onSubmit: () => void | Promise<void>;
};

const networks: { value: ChainNetwork; label: string }[] = [
  { value: "mainnet", label: "Main" },
  { value: "testnet", label: "Test" },
  { value: "futurenet", label: "Future" },
  { value: "custom", label: "Custom" },
];

export function PrivateAddChannelTemplate(
  props: PrivateAddChannelTemplateProps,
) {
  return (
    <SubpageShell title="Add Channel" onBack={props.onBack}>
      <div className="space-y-5">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.2) 0%, oklch(0.45 0.18 280 / 0.1) 100%)",
              border: "1px solid oklch(0.55 0.20 300 / 0.2)",
            }}
          >
            <IconShieldLock className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-xs text-foreground/50">
            Create a new private channel for confidential transactions
          </p>
        </div>

        {/* Error Message */}
        {props.error
          ? (
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
          )
          : null}

        {/* Form Card */}
        <div
          className="p-5 rounded-2xl space-y-5"
          style={{
            background: "oklch(0.15 0.03 265 / 0.5)",
            backdropFilter: "blur(12px)",
            border: "1px solid oklch(1 0 0 / 0.06)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.2)",
          }}
        >
          {/* Network Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
              Network
            </label>
            <div className="grid grid-cols-4 gap-2">
              {networks.map((net) => (
                <button
                  key={net.value}
                  type="button"
                  onClick={() => props.setNetwork(net.value)}
                  className={cn(
                    "py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                    props.network === net.value
                      ? "text-secondary"
                      : "text-foreground/50 hover:text-foreground/70",
                  )}
                  style={{
                    background: props.network === net.value
                      ? "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.2) 0%, oklch(0.45 0.18 280 / 0.1) 100%)"
                      : "oklch(0.18 0.03 265 / 0.5)",
                    border: props.network === net.value
                      ? "1px solid oklch(0.55 0.20 300 / 0.4)"
                      : "1px solid oklch(1 0 0 / 0.05)",
                  }}
                >
                  {net.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider"
            >
              Channel Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <IconHash className="h-4 w-4 text-foreground/30" />
              </div>
              <input
                id="name"
                type="text"
                value={props.name}
                disabled={props.busy}
                onChange={(e) => props.setName(e.target.value)}
                placeholder="My Private Channel"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Contract ID */}
          <div className="space-y-2">
            <label
              htmlFor="contractId"
              className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider"
            >
              Contract ID
            </label>
            <input
              id="contractId"
              type="text"
              value={props.contractId}
              disabled={props.busy}
              onChange={(e) => props.setContractId(e.target.value)}
              placeholder="C..."
              className="w-full px-4 py-3 rounded-xl text-xs font-mono bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors disabled:opacity-50"
            />
            <p className="text-[10px] text-foreground/40">
              The contract ID of the private channel on the Stellar network.
            </p>
          </div>

          {/* Asset */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
              Asset
            </label>
            <div className="flex gap-2">
              <div className="w-24">
                <input
                  type="text"
                  value={props.assetCode}
                  disabled={props.busy}
                  onChange={(e) => props.setAssetCode(e.target.value)}
                  placeholder="XLM"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors disabled:opacity-50 text-center font-bold"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={props.assetIssuer}
                  disabled={props.busy || props.isNativeXlm}
                  onChange={(e) => props.setAssetIssuer(e.target.value)}
                  placeholder={props.isNativeXlm ? "Native" : "Issuer Address"}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-xs font-mono bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors disabled:opacity-50",
                    props.isNativeXlm && "opacity-50",
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={props.busy || !props.canSubmit}
          onClick={() => props.onSubmit()}
          className="w-full py-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.20 300) 0%, oklch(0.45 0.18 280) 100%)",
            color: "white",
            boxShadow: "0 4px 16px oklch(0.55 0.20 300 / 0.3)",
          }}
        >
          {props.busy ? "Adding Channel..." : "Create Channel"}
        </button>
      </div>
    </SubpageShell>
  );
}
