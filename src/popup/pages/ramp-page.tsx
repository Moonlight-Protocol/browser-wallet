import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { getChainState } from "@/popup/api/get-chain-state.ts";
import { getPrivateStats } from "@/popup/api/get-private-stats.ts";
import { prepareWithdraw } from "@/popup/api/withdraw.ts";
import { RampFormTemplate } from "@/popup/templates/ramp-form-template.tsx";
import { toDecimals } from "@colibri/core";
import { StrKey } from "@colibri/core";
import type {
  DepositMethod,
  EntropyLevel,
} from "@/background/handlers/private/deposit.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export function RampPage() {
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
  const [availableBalance, setAvailableBalance] = useState<
    string | undefined
  >();
  const [privateBalance, setPrivateBalance] = useState<
    string | undefined
  >();

  // Initialize ramp mode - default to deposit, but can be set from state
  const [rampMode, setRampMode] = useState<"deposit" | "withdraw">("deposit");

  // Initialize form data from route params or use existing
  const [method, setMethod] = useState<DepositMethod>(
    state.depositFormData?.method ?? "DIRECT",
  );
  const [amount, setAmount] = useState(
    state.depositFormData?.amount ?? state.withdrawFormData?.amount ?? "",
  );
  const [entropyLevel, setEntropyLevel] = useState<EntropyLevel>(
    (state.depositFormData?.entropyLevel ??
      state.withdrawFormData?.entropyLevel) ?? "MEDIUM",
  );
  const [destinationAddress, setDestinationAddress] = useState(
    state.withdrawFormData?.destinationAddress ?? "",
  );
  const [addressError, setAddressError] = useState<string | undefined>();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

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
    // Prefer channel from form data if available
    const channelId = state.depositFormData?.channelId ??
      state.withdrawFormData?.channelId;
    if (channelId) {
      return privateChannels?.channels.find((c) => c.id === channelId);
    }
    // Otherwise use selected channel
    if (!privateChannels?.selectedChannelId) return undefined;
    return privateChannels.channels.find(
      (c) => c.id === privateChannels.selectedChannelId,
    );
  }, [
    privateChannels,
    state.depositFormData?.channelId,
    state.withdrawFormData?.channelId,
  ]);

  const selectedProvider = useMemo(() => {
    // Prefer provider from form data if available
    const providerId = state.depositFormData?.providerId ??
      state.withdrawFormData?.providerId;
    if (providerId && selectedChannel) {
      return selectedChannel.providers.find((p) => p.id === providerId);
    }
    // Otherwise use selected provider
    if (!selectedChannel?.selectedProviderId) return undefined;
    return selectedChannel.providers.find(
      (p) => p.id === selectedChannel.selectedProviderId,
    );
  }, [
    selectedChannel,
    state.depositFormData?.providerId,
    state.withdrawFormData?.providerId,
  ]);

  // Load available balance for deposit mode
  useEffect(() => {
    if (!selectedAccount || rampMode !== "deposit") return;
    getChainState({
      network,
      publicKey: selectedAccount.publicKey,
    })
      .then((res) => {
        if (res.state?.balanceXlm) {
          setAvailableBalance(res.state.balanceXlm);
        }
      })
      .catch((err) => {
        console.error("Failed to load balance", err);
      });
  }, [selectedAccount, network, rampMode]);

  // Load private balance for withdraw mode
  useEffect(() => {
    if (
      !selectedAccount ||
      rampMode !== "withdraw" ||
      !selectedChannel?.id
    ) {
      return;
    }
    getPrivateStats({
      network,
      accountId: selectedAccount.accountId,
      channelId: selectedChannel.id,
    })
      .then((stats) => {
        if (stats?.totalBalance) {
          const balanceFormatted = toDecimals(BigInt(stats.totalBalance), 7);
          setPrivateBalance(balanceFormatted);
        }
      })
      .catch((err) => {
        console.error("Failed to load private balance", err);
      });
  }, [selectedAccount, network, rampMode, selectedChannel?.id]);

  const hasValidSession = useMemo(() => {
    if (!selectedProvider || !selectedAccount) return false;
    const session = selectedProvider.sessions[selectedAccount.accountId];
    return session && session.expiresAt > Date.now();
  }, [selectedProvider, selectedAccount]);

  // Validate destination address format for withdraw
  useEffect(() => {
    if (rampMode !== "withdraw") {
      setAddressError(undefined);
      return;
    }
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
  }, [destinationAddress, rampMode]);

  const canSubmit = useMemo(() => {
    if (!selectedChannel || !selectedProvider || !hasValidSession) return false;
    if (!amount || parseFloat(amount) <= 0) return false;

    if (rampMode === "deposit") {
      if (
        availableBalance && parseFloat(amount) > parseFloat(availableBalance)
      ) {
        return false;
      }
    } else {
      // withdraw mode
      if (!destinationAddress.trim() || addressError) return false;
      // Note: private balance validation could be added here if needed
    }

    return true;
  }, [
    selectedChannel,
    selectedProvider,
    hasValidSession,
    amount,
    availableBalance,
    rampMode,
    destinationAddress,
    addressError,
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

      if (rampMode === "deposit") {
        // Deposit flow
        if (availableBalance && amountNum > parseFloat(availableBalance)) {
          setError("Amount exceeds available balance");
          setBusy(false);
          return;
        }

        // Save form data and navigate to review
        actions.setDepositFormData({
          channelId: selectedChannel.id,
          providerId: selectedProvider.id,
          method,
          amount,
          entropyLevel,
        });

        actions.goDepositReview();
      } else {
        // Withdraw flow
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
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to prepare transaction: ${msg}`);
      setBusy(false);
    }
  };

  if (!selectedChannel) {
    return (
      <RampFormTemplate
        channelName=""
        provider={undefined}
        rampMode={rampMode}
        onRampModeChange={setRampMode}
        method={method}
        setMethod={setMethod}
        amount={amount}
        setAmount={setAmount}
        entropyLevel={entropyLevel}
        setEntropyLevel={setEntropyLevel}
        destinationAddress={destinationAddress}
        setDestinationAddress={setDestinationAddress}
        addressError={addressError}
        availableBalance={availableBalance}
        privateBalance={privateBalance}
        busy={busy}
        error="Please select a private channel first"
        canSubmit={false}
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  if (!selectedProvider || !hasValidSession) {
    return (
      <RampFormTemplate
        channelName={selectedChannel.name}
        provider={undefined}
        rampMode={rampMode}
        onRampModeChange={setRampMode}
        method={method}
        setMethod={setMethod}
        amount={amount}
        setAmount={setAmount}
        entropyLevel={entropyLevel}
        setEntropyLevel={setEntropyLevel}
        destinationAddress={destinationAddress}
        setDestinationAddress={setDestinationAddress}
        addressError={addressError}
        availableBalance={availableBalance}
        privateBalance={privateBalance}
        busy={busy}
        error="Please connect to a privacy provider first"
        canSubmit={false}
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  return (
    <RampFormTemplate
      channelName={selectedChannel.name}
      provider={selectedProvider}
      rampMode={rampMode}
      onRampModeChange={setRampMode}
      method={method}
      setMethod={setMethod}
      amount={amount}
      setAmount={setAmount}
      entropyLevel={entropyLevel}
      setEntropyLevel={setEntropyLevel}
      destinationAddress={destinationAddress}
      setDestinationAddress={setDestinationAddress}
      addressError={addressError}
      availableBalance={availableBalance}
      privateBalance={privateBalance}
      busy={busy}
      error={error}
      canSubmit={canSubmit}
      onBack={() => actions.goHome()}
      onSubmit={handleSubmit}
    />
  );
}
