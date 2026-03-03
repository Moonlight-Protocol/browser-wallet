import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Card, CardContent } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import {
  IconCopy,
  IconExternalLink,
  IconInfoCircle,
} from "@tabler/icons-react";
import { shortenAddress } from "@/popup/utils/common.ts";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export function ReceiveConfirmationPage() {
  const { state, actions } = usePopup();
  const network =
    (state.status?.lastSelectedNetwork ?? "testnet") as ChainNetwork;
  const [privateChannels, setPrivateChannels] = useState<
    {
      channels: PrivateChannel[];
      selectedChannelId?: string;
    } | null
  >(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [mlxdrCopied, setMlxdrCopied] = useState(false);

  const receiveResult = state.receiveResult;

  // Load private channels to get channel name
  useEffect(() => {
    getPrivateChannels({ network })
      .then((res) => {
        if (res.ok) {
          setPrivateChannels({
            channels: res.channels,
            selectedChannelId: res.selectedChannelId,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load private channels", err);
      });
  }, [network]);

  const selectedChannel = useMemo(() => {
    if (!receiveResult || !privateChannels) return undefined;
    // Try to find channel from form data or selected channel
    const channelId = state.receiveFormData?.channelId ||
      privateChannels.selectedChannelId;
    return privateChannels.channels.find((c) => c.id === channelId);
  }, [receiveResult, privateChannels, state.receiveFormData?.channelId]);

  // Join MLXDR operations into a single string
  const mlxdrString = useMemo(() => {
    if (!receiveResult?.operationsMLXDR) return "";
    return receiveResult.operationsMLXDR.join("\n");
  }, [receiveResult]);

  const handleCopyAddress = async (index: number, publicKey: string) => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  const handleCopyMlxdr = async () => {
    try {
      await navigator.clipboard.writeText(mlxdrString);
      setMlxdrCopied(true);
      setTimeout(() => setMlxdrCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy MLXDR", err);
    }
  };

  if (!receiveResult) {
    return (
      <SubpageShell
        title="Receiving Address"
        onBack={() => actions.goHome()}
      >
        <div className="text-sm text-destructive">
          No receive data found. Please start over.
        </div>
        <Button onClick={() => actions.goHome()} className="mt-4">
          Go Home
        </Button>
      </SubpageShell>
    );
  }

  return (
    <SubpageShell
      title="Receiving Address"
      onBack={() => actions.goHome()}
    >
      <div className="space-y-4">
        {/* Channel and Expected Amount Info */}
        {selectedChannel && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <Text className="text-xs font-medium uppercase text-muted-foreground">
                  Channel
                </Text>
                <Text className="text-sm font-medium">
                  {selectedChannel.name}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text className="text-xs font-medium uppercase text-muted-foreground">
                  Expected Amount
                </Text>
                <Text className="text-sm font-medium">
                  {receiveResult.requestedAmount} {selectedChannel.asset.code}
                </Text>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receiving Address (MLXDR) */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Receiving Address (MLXDR)
              </Label>
              <button
                type="button"
                onClick={handleCopyMlxdr}
                className="h-7 w-7 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                title="Copy MLXDR"
              >
                {mlxdrCopied
                  ? <IconInfoCircle className="h-4 w-4 text-green-400" />
                  : <IconCopy className="h-4 w-4" />}
              </button>
            </div>
            <div className="p-3 rounded-md bg-muted/50 font-mono text-xs break-all">
              {mlxdrString.substring(0, 100)}...
            </div>
          </CardContent>
        </Card>

        {/* QR Code Placeholder */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-64 h-64 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
                <Text className="text-xs text-muted-foreground text-center px-4">
                  QR Code
                  <br />
                  (To be implemented)
                </Text>
              </div>
              <Text className="text-xs text-muted-foreground text-center">
                Scan this QR code to get the receiving address
              </Text>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Operations */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-sm font-semibold">
                Transaction Operations
              </Text>
              <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {receiveResult.numUtxos} Operations
              </div>
            </div>
            <div className="space-y-2">
              {receiveResult.utxos.map((utxo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">+</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-sm font-mono truncate">
                        {shortenAddress(utxo.publicKey)}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        create
                      </Text>
                    </div>
                    <Text className="text-sm font-medium whitespace-nowrap">
                      {parseFloat(utxo.amount) / 10_000_000} XLM
                    </Text>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(index, utxo.publicKey)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                      title="Copy address"
                    >
                      {copiedIndex === index
                        ? <IconInfoCircle className="h-4 w-4 text-green-400" />
                        : <IconExternalLink className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waiting for funds info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Text className="text-sm font-semibold">Waiting for funds</Text>
                <Text className="text-xs text-muted-foreground">
                  Share this address with the sender. The funds will appear in
                  your wallet once the transaction is confirmed on the network.
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={() => {
            actions.clearReceiveData();
            actions.goHome();
          }}
        >
          Close
        </Button>
      </div>
    </SubpageShell>
  );
}
