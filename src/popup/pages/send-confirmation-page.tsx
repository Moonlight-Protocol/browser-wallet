import { useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { send } from "@/popup/api/send.ts";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { shortenAddress } from "@/popup/utils/common.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

function getFeeForEntropyLevel(
  level: "LOW" | "MEDIUM" | "HIGH" | "V_HIGH",
): number {
  switch (level) {
    case "LOW":
      return 0.1;
    case "MEDIUM":
      return 0.25;
    case "HIGH":
      return 0.5;
    case "V_HIGH":
      return 1.0;
    default:
      return 0.25;
  }
}

export function SendConfirmationPage() {
  const { state, actions } = usePopup();
  const status = state.status;
  const selectedAccount = state.accounts?.find(
    (a) =>
      a.walletId === status?.lastSelectedAccount?.walletId &&
      a.accountId === status?.lastSelectedAccount?.accountId,
  ) ?? state.accounts?.[0];

  const network = (status?.lastSelectedNetwork ?? "testnet") as ChainNetwork;
  const [privateChannels, setPrivateChannels] = useState<
    {
      channels: PrivateChannel[];
      selectedChannelId?: string;
    } | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [operationsExpanded, setOperationsExpanded] = useState(false);

  const formData = state.sendFormData;
  const sendResult = state.sendResult;

  // Load private channels to get channel name
  useMemo(() => {
    if (!formData) return;
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
  }, [network, formData]);

  const selectedChannel = useMemo(() => {
    if (!formData || !privateChannels) return undefined;
    return privateChannels.channels.find((c) => c.id === formData.channelId);
  }, [formData, privateChannels]);

  const estimatedFee = useMemo(() => {
    if (!formData) return 0;
    return getFeeForEntropyLevel(formData.entropyLevel);
  }, [formData]);

  const totalAmount = useMemo(() => {
    if (!formData) return undefined;
    const amount = parseFloat(formData.amount);
    return (amount + estimatedFee).toFixed(7);
  }, [formData, estimatedFee]);

  const transferAmount = useMemo(() => {
    if (!formData) return undefined;
    return parseFloat(formData.amount).toFixed(7);
  }, [formData]);

  // Truncate MLXDR for display
  const truncatedMLXDR = useMemo(() => {
    if (!formData?.receiverOperationsMLXDR) return "";
    const mlxdr = formData.receiverOperationsMLXDR.trim();
    if (mlxdr.length <= 40) return mlxdr;
    return `${mlxdr.slice(0, 20)}...${mlxdr.slice(-20)}`;
  }, [formData]);

  const handleExecute = async () => {
    if (!formData || !selectedAccount || !sendResult) {
      setError("Missing form data, account, or prepared operations");
      return;
    }

    setError(undefined);
    setBusy(true);

    try {
      // Use prepared operations if available
      const result = await send({
        network,
        channelId: formData.channelId,
        providerId: formData.providerId,
        accountId: selectedAccount.accountId,
        receiverOperationsMLXDR: formData.receiverOperationsMLXDR,
        amount: formData.amount,
        entropyLevel: formData.entropyLevel,
        preparedOperationsMLXDR: sendResult.operationsMLXDR,
      });

      if (!result.ok) {
        setError(result.error?.message ?? "Failed to execute transaction");
        setBusy(false);
        return;
      }

      // Clear form data and go home on success
      actions.clearSendData();
      actions.goHome();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to execute transaction: ${msg}`);
      setBusy(false);
    }
  };

  if (!formData) {
    return (
      <SubpageShell
        title="Confirm Transfer"
        onBack={() => actions.goHome()}
      >
        <div className="text-sm text-destructive">
          No send data found. Please start over.
        </div>
        <Button onClick={() => actions.goHome()} className="mt-4">
          Go Home
        </Button>
      </SubpageShell>
    );
  }

  const entropyLabels: Record<
    "LOW" | "MEDIUM" | "HIGH" | "V_HIGH",
    string
  > = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    V_HIGH: "V.High",
  };

  return (
    <SubpageShell title="Confirm Transfer" onBack={() => actions.goSend()}>
      <div className="space-y-4">
        {/* Total Amount */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Text className="text-xs font-medium uppercase text-muted-foreground mb-2">
                Total Amount
              </Text>
              <Text className="text-2xl font-bold">
                {totalAmount} {selectedChannel?.asset.code ?? "XLM"}
              </Text>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <Text className="text-sm text-muted-foreground">
                  Transfer Amount
                </Text>
                <Text className="text-sm font-medium">
                  {transferAmount} {selectedChannel?.asset.code ?? "XLM"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-sm text-muted-foreground">
                  Network Fee
                </Text>
                <Text className="text-sm font-medium">
                  {estimatedFee.toFixed(7)}{" "}
                  {selectedChannel?.asset.code ?? "XLM"}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipient Address */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Text className="text-xs font-medium uppercase text-muted-foreground">
              Recipient Address
            </Text>
            <div className="flex items-center gap-2">
              <Text className="text-sm font-mono flex-1 break-all">
                {truncatedMLXDR}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    formData.receiverOperationsMLXDR,
                  );
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Text className="text-sm font-semibold mb-3">
              Transaction Details
            </Text>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="text-xs text-muted-foreground">
                  Privacy Level
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                >
                  {entropyLabels[formData.entropyLevel]}
                </Button>
              </div>
              {selectedAccount?.name && (
                <div className="flex justify-between">
                  <Text className="text-xs text-muted-foreground">Account</Text>
                  <Text className="text-xs font-medium">
                    {selectedAccount.name}
                  </Text>
                </div>
              )}
              {selectedChannel && (
                <div className="flex justify-between">
                  <Text className="text-xs text-muted-foreground">Channel</Text>
                  <Text className="text-xs font-medium">
                    {selectedChannel.name}
                  </Text>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Operations */}
        {sendResult && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm font-semibold">
                  Transaction Operations
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOperationsExpanded(!operationsExpanded)}
                  className="h-6 px-2"
                >
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mr-1">
                    {sendResult.numSpends + sendResult.numCreates} Operations
                  </span>
                  {operationsExpanded
                    ? <IconChevronUp className="h-3 w-3" />
                    : <IconChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              <Text className="text-sm text-muted-foreground">
                {sendResult.numSpends} SPEND operations, {sendResult.numCreates}
                {" "}
                CREATE operations
              </Text>
              {operationsExpanded && (
                <div className="pt-2 space-y-2">
                  {/* CREATE Operations */}
                  {sendResult.createOperations &&
                    sendResult.createOperations.length > 0 && (
                    <div className="space-y-1">
                      <Text className="text-xs font-semibold text-muted-foreground">
                        CREATE Operations ({sendResult.createOperations.length})
                      </Text>
                      {sendResult.createOperations.map((op, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                +
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Text className="text-sm font-mono truncate">
                                {shortenAddress(op.publicKey)}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {op.type === "receiver" ? "Receiver" : "Change"}
                              </Text>
                            </div>
                            <Text className="text-sm font-medium whitespace-nowrap">
                              {(parseFloat(op.amount) / 1e7).toFixed(7)} XLM
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SPEND Operations */}
                  {sendResult.spendOperations &&
                    sendResult.spendOperations.length > 0 && (
                    <div className="space-y-1">
                      <Text className="text-xs font-semibold text-muted-foreground">
                        SPEND Operations ({sendResult.spendOperations.length})
                      </Text>
                      {sendResult.spendOperations.map((op, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-orange-500">
                                -
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Text className="text-sm font-mono truncate">
                                {shortenAddress(op.utxoPublicKey)}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {op.conditionsCount} conditions
                              </Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <IconAlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 space-y-1">
                <Text className="text-sm font-semibold">
                  Verify Before Proceeding
                </Text>
                <Text className="text-xs text-muted-foreground">
                  This action cannot be undone. Double-check all details before
                  executing the transaction.
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {error
          ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )
          : null}

        <CardFooter className="px-0 space-y-2">
          <Button
            className="w-full"
            disabled={busy}
            onClick={handleExecute}
            loading={busy}
          >
            Execute Transaction
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => actions.goSend()}
          >
            Go Back
          </Button>
        </CardFooter>
      </div>
    </SubpageShell>
  );
}
