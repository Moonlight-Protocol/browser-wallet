import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { getChainState } from "@/popup/api/get-chain-state.ts";
import { DepositFormTemplate } from "@/popup/templates/deposit-form-template.tsx";
import type {
  DepositMethod,
  EntropyLevel,
} from "@/background/handlers/private/deposit.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export function DepositPage() {
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

  // Initialize form data from route params or use existing
  const [method, setMethod] = useState<DepositMethod>(
    state.depositFormData?.method ?? "DIRECT",
  );
  const [amount, setAmount] = useState(state.depositFormData?.amount ?? "");
  const [entropyLevel, setEntropyLevel] = useState<EntropyLevel>(
    state.depositFormData?.entropyLevel ?? "MEDIUM",
  );

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

  // Load available balance
  useEffect(() => {
    if (!selectedAccount) return;
    getChainState({
      network,
      publicKey: selectedAccount.publicKey,
    })
      .then((res) => {
        if (res.ok && res.state?.balanceXlm) {
          setAvailableBalance(res.state.balanceXlm);
        }
      })
      .catch((err) => {
        console.error("Failed to load balance", err);
      });
  }, [selectedAccount, network]);

  const selectedChannel = useMemo(() => {
    if (!privateChannels?.selectedChannelId) return undefined;
    return privateChannels.channels.find(
      (c) => c.id === privateChannels.selectedChannelId,
    );
  }, [privateChannels]);

  const selectedProvider = useMemo(() => {
    if (!selectedChannel?.selectedProviderId) return undefined;
    return selectedChannel.providers.find(
      (p) => p.id === selectedChannel.selectedProviderId,
    );
  }, [selectedChannel]);

  const hasValidSession = useMemo(() => {
    if (!selectedProvider || !selectedAccount) return false;
    const session = selectedProvider.sessions[selectedAccount.accountId];
    return session && session.expiresAt > Date.now();
  }, [selectedProvider, selectedAccount]);

  const canSubmit = useMemo(() => {
    if (!selectedChannel || !selectedProvider || !hasValidSession) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    if (availableBalance && parseFloat(amount) > parseFloat(availableBalance)) {
      return false;
    }
    return true;
  }, [
    selectedChannel,
    selectedProvider,
    hasValidSession,
    amount,
    availableBalance,
  ]);

  const handleSubmit = () => {
    if (!canSubmit || !selectedChannel || !selectedProvider) return;

    setError(undefined);

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (availableBalance && amountNum > parseFloat(availableBalance)) {
      setError("Amount exceeds available balance");
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
  };

  if (!selectedChannel) {
    return (
      <DepositFormTemplate
        channelName=""
        provider={undefined}
        method={method}
        setMethod={setMethod}
        amount={amount}
        setAmount={setAmount}
        entropyLevel={entropyLevel}
        setEntropyLevel={setEntropyLevel}
        availableBalance={availableBalance}
        busy={false}
        error="Please select a private channel first"
        canSubmit={false}
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  if (!selectedProvider || !hasValidSession) {
    return (
      <DepositFormTemplate
        channelName={selectedChannel.name}
        provider={undefined}
        method={method}
        setMethod={setMethod}
        amount={amount}
        setAmount={setAmount}
        entropyLevel={entropyLevel}
        setEntropyLevel={setEntropyLevel}
        availableBalance={availableBalance}
        busy={false}
        error="Please connect to a privacy provider first"
        canSubmit={false}
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  return (
    <DepositFormTemplate
      channelName={selectedChannel.name}
      provider={selectedProvider}
      method={method}
      setMethod={setMethod}
      amount={amount}
      setAmount={setAmount}
      entropyLevel={entropyLevel}
      setEntropyLevel={setEntropyLevel}
      availableBalance={availableBalance}
      busy={false}
      error={error}
      canSubmit={canSubmit}
      onBack={() => actions.goHome()}
      onSubmit={handleSubmit}
    />
  );
}
