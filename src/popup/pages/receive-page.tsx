import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { ReceiveFormTemplate } from "@/popup/templates/receive-form-template.tsx";
import { receive } from "@/popup/api/receive.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export function ReceivePage() {
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
  const [amount, setAmount] = useState(state.receiveFormData?.amount ?? "");
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
    if (state.receiveFormData?.channelId) {
      return privateChannels?.channels.find(
        (c) => c.id === state.receiveFormData?.channelId,
      );
    }
    if (!privateChannels?.selectedChannelId) return undefined;
    return privateChannels.channels.find(
      (c) => c.id === privateChannels.selectedChannelId,
    );
  }, [privateChannels, state.receiveFormData?.channelId]);

  const selectedProvider = useMemo(() => {
    if (state.receiveFormData?.providerId) {
      return selectedChannel?.providers.find(
        (p) => p.id === state.receiveFormData?.providerId,
      );
    }
    if (!selectedChannel?.selectedProviderId) return undefined;
    return selectedChannel.providers.find(
      (p) => p.id === selectedChannel.selectedProviderId,
    );
  }, [selectedChannel, state.receiveFormData?.providerId]);

  const hasValidSession = useMemo(() => {
    if (!selectedProvider || !selectedAccount) return false;
    const session = selectedProvider.sessions[selectedAccount.accountId];
    return session && session.expiresAt > Date.now();
  }, [selectedProvider, selectedAccount]);

  const canSubmit = useMemo(() => {
    if (!selectedChannel || !selectedProvider || !hasValidSession) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
  }, [
    selectedChannel,
    selectedProvider,
    hasValidSession,
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
      actions.setReceiveFormData({
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        amount,
      });

      // Call receive API
      const result = await receive({
        network,
        channelId: selectedChannel.id,
        providerId: selectedProvider.id,
        accountId: selectedAccount.accountId,
        amount,
      });

      if (!result.ok) {
        setError(result.error?.message ?? "Failed to generate receive address");
        setBusy(false);
        return;
      }

      // Save result and navigate to confirmation
      if (result.operationsMLXDR && result.utxos) {
        actions.setReceiveResult({
          operationsMLXDR: result.operationsMLXDR,
          utxos: result.utxos,
          requestedAmount: result.requestedAmount ?? amount,
          numUtxos: result.numUtxos ?? 5,
        });
        actions.goReceiveConfirmation();
      } else {
        setError("Invalid response from receive API");
        setBusy(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to generate receive address: ${msg}`);
      setBusy(false);
    }
  };

  if (!selectedChannel) {
    return (
      <ReceiveFormTemplate
        channelName=""
        assetCode="XLM"
        accountName={selectedAccount?.name}
        provider={undefined}
        amount={amount}
        setAmount={setAmount}
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
      <ReceiveFormTemplate
        channelName={selectedChannel.name}
        assetCode={selectedChannel.asset.code}
        accountName={selectedAccount?.name}
        provider={undefined}
        amount={amount}
        setAmount={setAmount}
        busy={busy}
        error="Please connect to a privacy provider first"
        canSubmit={false}
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  return (
    <ReceiveFormTemplate
      channelName={selectedChannel.name}
      assetCode={selectedChannel.asset.code}
      accountName={selectedAccount?.name}
      provider={selectedProvider}
      amount={amount}
      setAmount={setAmount}
      maxAmount="1,000"
      busy={busy}
      error={error}
      canSubmit={canSubmit}
      onBack={() => actions.goHome()}
      onSubmit={handleSubmit}
    />
  );
}
