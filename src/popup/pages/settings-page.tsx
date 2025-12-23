import { useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { SettingsTemplate } from "@/popup/templates/settings-template.tsx";
import { setNetwork } from "@/popup/api/set-network.ts";

type Network = "mainnet" | "testnet" | "futurenet" | "custom";

export function SettingsPage() {
  const { state, actions } = usePopup();
  const status = state.status;

  const selectedNetwork = (status?.lastSelectedNetwork ?? "mainnet") as Network;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const networkItems = useMemo(
    () => [
      { key: "mainnet" as const, label: "Mainnet", disabled: false },
      { key: "testnet" as const, label: "Testnet", disabled: false },
      { key: "futurenet" as const, label: "Futurenet", disabled: false },
      { key: "custom" as const, label: "Custom (disabled)", disabled: true },
    ],
    []
  );

  const onSelectNetwork = async (network: Exclude<Network, "custom">) => {
    setError(undefined);
    setBusy(true);
    try {
      await setNetwork(network);
      await actions.refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsTemplate
      selectedNetwork={selectedNetwork}
      customNetworkName={status?.customNetworkName}
      networkItems={networkItems}
      busy={busy}
      error={error}
      onBack={() => {
        actions.goHome();
      }}
      onSelectNetwork={onSelectNetwork}
    />
  );
}
