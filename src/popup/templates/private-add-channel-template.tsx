import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/popup/atoms/tabs.tsx";
import { cn } from "@/popup/utils/cn.ts";
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

export function PrivateAddChannelTemplate(
  props: PrivateAddChannelTemplateProps
) {
  return (
    <SubpageShell title="Add Channel" onBack={props.onBack}>
      <div className="space-y-4">
        {props.error ? (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {props.error}
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Network</Label>
              <Tabs
                value={props.network}
                onValueChange={(v) => props.setNetwork(v as ChainNetwork)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="mainnet">Main</TabsTrigger>
                  <TabsTrigger value="testnet">Test</TabsTrigger>
                  <TabsTrigger value="futurenet">Future</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={props.name}
                disabled={props.busy}
                onChange={(e) => props.setName(e.target.value)}
                placeholder="My Private Channel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractId">Contract ID</Label>
              <Input
                id="contractId"
                value={props.contractId}
                disabled={props.busy}
                onChange={(e) => props.setContractId(e.target.value)}
                placeholder="C..."
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                The contract ID of the private channel.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Asset</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={props.assetCode}
                    disabled={props.busy}
                    onChange={(e) => props.setAssetCode(e.target.value)}
                    placeholder="Code (e.g. XLM)"
                  />
                </div>
                <div className="flex-[2]">
                  <Input
                    value={props.assetIssuer}
                    disabled={props.busy || props.isNativeXlm}
                    onChange={(e) => props.setAssetIssuer(e.target.value)}
                    placeholder={
                      props.isNativeXlm ? "Native" : "Issuer Address"
                    }
                    className={cn(props.isNativeXlm && "opacity-50")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={props.busy || !props.canSubmit}
              onClick={() => props.onSubmit()}
              loading={props.busy}
            >
              {props.busy ? "Adding Channel..." : "Add Channel"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SubpageShell>
  );
}
