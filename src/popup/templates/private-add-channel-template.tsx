import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { cn } from "@/popup/utils/cn.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateAddChannelTemplateProps = {
  network: ChainNetwork;
  setNetwork: (v: ChainNetwork) => void;

  name: string;
  setName: (v: string) => void;

  contractId: string;
  setContractId: (v: string) => void;

  quorumContractId: string;
  setQuorumContractId: (v: string) => void;

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

export function PrivateAddChannelTemplate(props: PrivateAddChannelTemplateProps) {
  return (
    <SubpageShell title="Add channel" onBack={props.onBack}>
      {props.error ? (
        <Text tone="error" size="sm">
          {props.error}
        </Text>
      ) : null}

      <div className="mt-2">
        <div className="text-xs text-muted">Network</div>
        <select
          value={props.network}
          disabled={props.busy}
          onChange={(e) => props.setNetwork(e.target.value as ChainNetwork)}
          className={cn(
            "mt-2 w-full rounded-md border border-muted bg-background text-primary",
            "px-3 py-2",
            "disabled:opacity-50",
          )}
        >
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
          <option value="futurenet">Futurenet</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted">Name</div>
        <Input
          className="mt-2"
          value={props.name}
          disabled={props.busy}
          onChange={(e) => props.setName(e.target.value)}
          placeholder="Channel name"
        />
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted">Contract ID</div>
        <Input
          className="mt-2"
          value={props.contractId}
          disabled={props.busy}
          onChange={(e) => props.setContractId(e.target.value)}
          placeholder="C… (Stellar contract id)"
        />
        <div className="mt-1 text-xs text-muted">Contracts start with “C”.</div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted">Quorum contract ID</div>
        <Input
          className="mt-2"
          value={props.quorumContractId}
          disabled={props.busy}
          onChange={(e) => props.setQuorumContractId(e.target.value)}
          placeholder="C… (quorum contract id)"
        />
        <div className="mt-1 text-xs text-muted">Contracts start with “C”.</div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted">Asset</div>
        <div className="mt-2 flex gap-2">
          <Input
            className="flex-1"
            value={props.assetCode}
            disabled={props.busy}
            onChange={(e) => props.setAssetCode(e.target.value)}
            placeholder="Code (e.g. XLM)"
          />
          <Input
            className="flex-[2]"
            value={props.assetIssuer}
            disabled={props.busy || props.isNativeXlm}
            onChange={(e) => props.setAssetIssuer(e.target.value)}
            placeholder={props.isNativeXlm ? "Issuer (disabled)" : "Issuer (optional)"}
          />
        </div>
        {props.isNativeXlm ? (
          <div className="mt-1 text-xs text-muted">Native XLM</div>
        ) : null}
      </div>

      <div className="mt-4">
        <Button
          className="w-full"
          disabled={props.busy || !props.canSubmit}
          onClick={() => props.onSubmit()}
        >
          {props.busy ? "Adding…" : "Add channel"}
        </Button>
      </div>
    </SubpageShell>
  );
}
