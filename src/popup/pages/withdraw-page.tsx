import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { prepareWithdraw } from "@/popup/api/withdraw.ts";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Card, CardContent, CardFooter } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { IconInfoCircle } from "@tabler/icons-react";
import { StrKey } from "@colibri/core";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import type { EntropyLevel } from "@/background/handlers/private/withdraw.types.ts";

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

export function WithdrawPage() {
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
  const [destinationAddress, setDestinationAddress] = useState(
    state.withdrawFormData?.destinationAddress ?? "",
  );
  const [amount, setAmount] = useState(state.withdrawFormData?.amount ?? "");
  const [entropyLevel, setEntropyLevel] = useState<EntropyLevel>(
    (state.withdrawFormData?.entropyLevel as EntropyLevel) ?? "MEDIUM",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [addressError, setAddressError] = useState<string | undefined>();

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
    if (state.withdrawFormData?.channelId) {
      return privateChannels?.channels.find(
        (c) => c.id === state.withdrawFormData?.channelId,
      );
    }
    if (!privateChannels?.selectedChannelId) return undefined;
    return privateChannels.channels.find(
      (c) => c.id === privateChannels.selectedChannelId,
    );
  }, [privateChannels, state.withdrawFormData?.channelId]);

  const selectedProvider = useMemo(() => {
    if (state.withdrawFormData?.providerId) {
      return selectedChannel?.providers.find(
        (p) => p.id === state.withdrawFormData?.providerId,
      );
    }
    if (!selectedChannel?.selectedProviderId) return undefined;
    return selectedChannel.providers.find(
      (p) => p.id === selectedChannel.selectedProviderId,
    );
  }, [selectedChannel, state.withdrawFormData?.providerId]);

  const hasValidSession = useMemo(() => {
    if (!selectedProvider || !selectedAccount) return false;
    const session = selectedProvider.sessions[selectedAccount.accountId];
    return session && session.expiresAt > Date.now();
  }, [selectedProvider, selectedAccount]);

  // Validate destination address format
  useEffect(() => {
    if (!destinationAddress.trim()) {
      setAddressError(undefined);
      return;
    }

    const trimmed = destinationAddress.trim();
    if (!StrKey.isValidEd25519PublicKey(trimmed)) {
      setAddressError("Invalid Stellar address format");
      return;
    }

    setAddressError(undefined);
  }, [destinationAddress]);

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
    if (!destinationAddress.trim() || addressError) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
  }, [
    selectedChannel,
    selectedProvider,
    hasValidSession,
    destinationAddress,
    addressError,
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

      // Validate address
      const trimmedAddress = destinationAddress.trim();
      if (!StrKey.isValidEd25519PublicKey(trimmedAddress)) {
        setError("Invalid destination address");
        setBusy(false);
        return;
      }

      // Save form data
      actions.setWithdrawFormData({
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        destinationAddress: trimmedAddress,
        amount,
        entropyLevel,
      });

      // Call prepareWithdraw to prepare operations
      const result = await prepareWithdraw({
        network,
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        accountId: selectedAccount.accountId,
        destinationAddress: trimmedAddress,
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
        result.withdrawOperation && result.spendOperations &&
        result.operationsMLXDR
      ) {
        actions.setWithdrawResult({
          withdrawOperation: result.withdrawOperation,
          changeOperations: result.changeOperations ?? [],
          spendOperations: result.spendOperations,
          operationsMLXDR: result.operationsMLXDR,
          totalSpendAmount: result.totalSpendAmount ?? "0",
          changeAmount: result.changeAmount ?? "0",
          withdrawAmount: result.withdrawAmount ?? "0",
          numSpends: result.numSpends ?? 0,
          numCreates: result.numCreates ?? 0,
        });
        actions.goWithdrawConfirmation();
      } else {
        setError("Invalid response from prepare withdraw");
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
      <SubpageShell title="Withdraw Funds" onBack={() => actions.goHome()}>
        <div className="text-sm text-destructive">
          Please select a private channel first
        </div>
      </SubpageShell>
    );
  }

  if (!selectedProvider || !hasValidSession) {
    return (
      <SubpageShell title="Withdraw Funds" onBack={() => actions.goHome()}>
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
    <SubpageShell title="Withdraw Funds" onBack={() => actions.goHome()}>
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

        {/* Destination Address */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label
              htmlFor="destination"
              className="text-xs uppercase text-muted-foreground"
            >
              Destination Address (G Account)
            </Label>
            <Input
              id="destination"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="G..."
              disabled={busy}
              className="font-mono text-sm"
            />
            {addressError && (
              <Text className="text-xs text-destructive">{addressError}</Text>
            )}
            {!addressError && destinationAddress.trim() && (
              <Text className="text-xs text-green-600">
                ✓ Address looks valid
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

        {/* Withdraw Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Text className="text-sm font-semibold">Withdraw to G Account</Text>
                <Text className="text-xs text-muted-foreground">
                  Funds will be withdrawn from the Privacy Channel directly to
                  the specified Stellar address. Higher privacy levels add more
                  UTXOs to further obscure the transaction.
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
            Review Withdraw
          </Button>
        </CardFooter>
      </div>
    </SubpageShell>
  );
}
