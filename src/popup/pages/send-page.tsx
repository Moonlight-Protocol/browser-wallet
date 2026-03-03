import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { prepareSend } from "@/popup/api/send.ts";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Textarea } from "@/popup/atoms/textarea.tsx";
import { IconInfoCircle } from "@tabler/icons-react";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import type { EntropyLevel } from "@/background/handlers/private/send.types.ts";

function getFeeForEntropyLevel(level: EntropyLevel): number {
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

export function SendPage() {
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
  const [receiverMLXDR, setReceiverMLXDR] = useState(
    state.sendFormData?.receiverOperationsMLXDR ?? "",
  );
  const [amount, setAmount] = useState(state.sendFormData?.amount ?? "");
  const [entropyLevel, setEntropyLevel] = useState<EntropyLevel>(
    (state.sendFormData?.entropyLevel as EntropyLevel) ?? "MEDIUM",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [parseError, setParseError] = useState<string | undefined>();

  // Load private channels
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
    if (state.sendFormData?.channelId) {
      return privateChannels?.channels.find(
        (c) => c.id === state.sendFormData?.channelId,
      );
    }
    if (!privateChannels?.selectedChannelId) return undefined;
    return privateChannels.channels.find(
      (c) => c.id === privateChannels.selectedChannelId,
    );
  }, [privateChannels, state.sendFormData?.channelId]);

  const selectedProvider = useMemo(() => {
    if (state.sendFormData?.providerId) {
      return selectedChannel?.providers.find(
        (p) => p.id === state.sendFormData?.providerId,
      );
    }
    if (!selectedChannel?.selectedProviderId) return undefined;
    return selectedChannel.providers.find(
      (p) => p.id === selectedChannel.selectedProviderId,
    );
  }, [selectedChannel, state.sendFormData?.providerId]);

  const hasValidSession = useMemo(() => {
    if (!selectedProvider || !selectedAccount) return false;
    const session = selectedProvider.sessions[selectedAccount.accountId];
    return session && session.expiresAt > Date.now();
  }, [selectedProvider, selectedAccount]);

  // Validate MLXDR format (basic check)
  useEffect(() => {
    if (!receiverMLXDR.trim()) {
      setParseError(undefined);
      return;
    }

    const operationStrings = receiverMLXDR
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (operationStrings.length === 0) {
      setParseError("No operations found in receiving address");
      return;
    }

    // Basic validation - check if it looks like MLXDR (base64-like)
    const isValidFormat = operationStrings.every((op) => {
      // MLXDR is base64-like, should be alphanumeric with some special chars
      return /^[A-Za-z0-9+/=\s]+$/.test(op) && op.length > 20;
    });

    if (!isValidFormat) {
      setParseError("Invalid receiving address format");
      return;
    }

    setParseError(undefined);
  }, [receiverMLXDR]);

  const estimatedFee = useMemo(() => {
    return getFeeForEntropyLevel(entropyLevel);
  }, [entropyLevel]);

  const totalAmount = useMemo(() => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return 0;
    return amountNum + estimatedFee;
  }, [amount, estimatedFee]);

  const canSubmit = useMemo(() => {
    if (!selectedChannel || !selectedProvider || !hasValidSession) return false;
    if (!receiverMLXDR.trim() || parseError) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
  }, [
    selectedChannel,
    selectedProvider,
    hasValidSession,
    receiverMLXDR,
    parseError,
    amount,
  ]);

  const handleSubmit = async () => {
    if (
      !canSubmit || !selectedChannel || !selectedProvider || !selectedAccount
    ) {
      return;
    }

    setError(undefined);
    setBusy(true);

    try {
      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Amount must be greater than 0");
        setBusy(false);
        return;
      }

      // Save form data
      actions.setSendFormData({
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        receiverOperationsMLXDR: receiverMLXDR.trim(),
        amount,
        entropyLevel,
      });

      // Call prepareSend to prepare operations
      const result = await prepareSend({
        network,
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        accountId: selectedAccount.accountId,
        receiverOperationsMLXDR: receiverMLXDR.trim(),
        amount,
        entropyLevel,
      });

      if (!result.ok) {
        setError(result.error?.message ?? "Failed to prepare transaction");
        setBusy(false);
        return;
      }

      // Save result and navigate to confirmation
      if (
        result.createOperations && result.spendOperations &&
        result.operationsMLXDR
      ) {
        actions.setSendResult({
          createOperations: result.createOperations,
          spendOperations: result.spendOperations,
          operationsMLXDR: result.operationsMLXDR,
          totalSpendAmount: result.totalSpendAmount ?? "0",
          changeAmount: result.changeAmount ?? "0",
          receiverAmount: result.receiverAmount ?? "0",
          numSpends: result.numSpends ?? 0,
          numCreates: result.numCreates ?? 0,
        });
        actions.goSendConfirmation();
      } else {
        setError("Invalid response from prepare send");
        setBusy(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to prepare transaction: ${msg}`);
      setBusy(false);
    }
  };

  if (!selectedChannel) {
    return (
      <SubpageShell title="Send Funds" onBack={() => actions.goHome()}>
        <div className="text-sm text-destructive">
          Please select a private channel first
        </div>
      </SubpageShell>
    );
  }

  if (!selectedProvider || !hasValidSession) {
    return (
      <SubpageShell title="Send Funds" onBack={() => actions.goHome()}>
        <div className="text-sm text-destructive">
          Please connect to a privacy provider first
        </div>
      </SubpageShell>
    );
  }

  const entropyLevels: EntropyLevel[] = ["LOW", "MEDIUM", "HIGH", "V_HIGH"];
  const entropyLabels: Record<EntropyLevel, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    V_HIGH: "V.High",
  };

  return (
    <SubpageShell title="Send Funds" onBack={() => actions.goHome()}>
      <div className="space-y-4">
        {/* Account/Channel Info */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {selectedAccount?.name && (
              <div className="flex justify-between items-center">
                <Text className="text-xs font-medium uppercase text-muted-foreground">
                  Account
                </Text>
                <Text className="text-sm font-medium">
                  {selectedAccount.name}
                </Text>
              </div>
            )}
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
                Asset
              </Text>
              <Text className="text-sm font-medium">
                {selectedChannel.asset.code}
              </Text>
            </div>
          </CardContent>
        </Card>

        {/* Receiving Address (MLXDR) */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label
              htmlFor="mlxdr"
              className="text-xs uppercase text-muted-foreground"
            >
              Receiving Address (MLXDR)
            </Label>
            <Textarea
              id="mlxdr"
              value={receiverMLXDR}
              onChange={(e) => setReceiverMLXDR(e.target.value)}
              placeholder="Paste receiving address here..."
              disabled={busy}
              className="min-h-[120px] font-mono text-xs"
            />
            {parseError && (
              <Text className="text-xs text-destructive">{parseError}</Text>
            )}
            {!parseError && receiverMLXDR.trim() && (
              <Text className="text-xs text-green-600">
                ✓ Receiving address looks valid
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-xs uppercase text-muted-foreground"
              >
                Amount
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={busy}
                  className="flex-1 text-lg"
                />
                <Text className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedChannel.asset.code}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Level */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-xs uppercase text-muted-foreground">
              Privacy Level
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {entropyLevels.map((level) => (
                <Button
                  key={level}
                  variant={entropyLevel === level ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setEntropyLevel(level)}
                  disabled={busy}
                >
                  {entropyLabels[level]}
                </Button>
              ))}
            </div>
            <Text className="text-xs text-muted-foreground">
              Higher privacy = More UTXOs = Higher fees
            </Text>
          </CardContent>
        </Card>

        {/* Fee and Total */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <Text className="text-xs font-medium uppercase text-muted-foreground">
                Estimated Fee
              </Text>
              <Text className="text-sm font-semibold">
                {estimatedFee.toFixed(2)} {selectedChannel.asset.code}
              </Text>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <Text className="text-sm font-semibold">Total</Text>
              <Text className="text-lg font-bold">
                {totalAmount.toFixed(2)} {selectedChannel.asset.code}
              </Text>
            </div>
          </CardContent>
        </Card>

        {/* Private Transfer Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Text className="text-sm font-semibold">Private Transfer</Text>
                <Text className="text-xs text-muted-foreground">
                  This transaction will be bundled with other operations for
                  enhanced privacy. Higher privacy levels add more UTXOs to
                  further obscure the transaction.
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

        <CardFooter className="px-0">
          <Button
            className="w-full"
            disabled={!canSubmit || busy}
            onClick={handleSubmit}
            loading={busy}
          >
            Review Transfer
          </Button>
        </CardFooter>
      </div>
    </SubpageShell>
  );
}
