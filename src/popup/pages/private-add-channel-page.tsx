import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { addPrivateChannel } from "@/popup/api/add-private-channel.ts";
import { PrivateAddChannelTemplate } from "@/popup/templates/private-add-channel-template.tsx";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export function PrivateAddChannelPage() {
  const { state, actions } = usePopup();
  const status = state.status;

  const defaultNetwork = (status?.lastSelectedNetwork ?? "mainnet") as ChainNetwork;

  const [network, setNetwork] = useState<ChainNetwork>(defaultNetwork);
  const [name, setName] = useState("");
  const [contractId, setContractId] = useState("");
  const [quorumContractId, setQuorumContractId] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetIssuer, setAssetIssuer] = useState("");

  const isNativeXlm = assetCode.trim().toUpperCase() === "XLM";

  useEffect(() => {
    if (!isNativeXlm) return;
    if (!assetIssuer) return;
    setAssetIssuer("");
  }, [isNativeXlm, assetIssuer]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const canSubmit = useMemo(() => {
    return Boolean(
      name.trim() &&
        contractId.trim() &&
        quorumContractId.trim() &&
        assetCode.trim(),
    );
  }, [quorumContractId, assetCode, contractId, name]);

  const onSubmit = async () => {
    if (!canSubmit) return;

    setError(undefined);
    setBusy(true);
    try {
      const res = await addPrivateChannel({
        network,
        name: name.trim(),
        contractId: contractId.trim(),
        quorumContractId: quorumContractId.trim(),
        asset: {
          code: assetCode.trim(),
          issuer: assetIssuer.trim() ? assetIssuer.trim() : undefined,
        },
      });

      if (!res.ok) {
        setError(res.error.message ?? "Failed to add channel");
        return;
      }

      actions.goHome();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PrivateAddChannelTemplate
      network={network}
      setNetwork={setNetwork}
      name={name}
      setName={setName}
      contractId={contractId}
      setContractId={setContractId}
      quorumContractId={quorumContractId}
      setQuorumContractId={setQuorumContractId}
      assetCode={assetCode}
      setAssetCode={setAssetCode}
      assetIssuer={assetIssuer}
      setAssetIssuer={setAssetIssuer}
      isNativeXlm={isNativeXlm}
      busy={busy}
      error={error}
      canSubmit={canSubmit}
      onBack={() => actions.goHome()}
      onSubmit={onSubmit}
    />
  );
}
