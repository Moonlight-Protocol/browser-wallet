import { useEffect, useMemo, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { deposit, prepareDeposit } from "@/popup/api/deposit.ts";
import { DepositReviewTemplate } from "@/popup/templates/deposit-review-template.tsx";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import type { PrepareDepositResponse } from "@/background/handlers/private/deposit.types.ts";

function getUtxoCountFromEntropyLevel(
  level: "LOW" | "MEDIUM" | "HIGH" | "V_HIGH",
): number {
  switch (level) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 5;
    case "HIGH":
      return 10;
    case "V_HIGH":
      return 20;
    default:
      return 5;
  }
}

function getFeeForEntropyLevel(
  level: "LOW" | "MEDIUM" | "HIGH" | "V_HIGH",
): number {
  switch (level) {
    case "LOW":
      return 0.05;
    case "MEDIUM":
      return 0.25;
    case "HIGH":
      return 0.5;
    case "V_HIGH":
      return 0.75;
    default:
      return 0.25;
  }
}

export function DepositReviewPage() {
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

  const formData = state.depositFormData;
  const depositResult = state.depositResult;

  // Load private channels to get channel name
  useEffect(() => {
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

  // Prepare deposit operations when page loads
  useEffect(() => {
    if (!formData || !selectedAccount || depositResult) return;

    prepareDeposit({
      network,
      channelId: formData.channelId,
      providerId: formData.providerId,
      accountId: selectedAccount.accountId,
      amount: formData.amount,
      entropyLevel: formData.entropyLevel,
    })
      .then((res: PrepareDepositResponse) => {
        if (res.ok) {
          // Cast to relax type coupling if PopupState changes shape slightly
          actions.setDepositResult({
            createOperations: res.createOperations ?? [],
            operationsMLXDR: res.operationsMLXDR ?? [],
            numUtxos: res.numUtxos ?? 0,
            depositAmount: res.depositAmount ?? "0",
            feeAmount: res.feeAmount ?? "0",
            depositOperation: res.depositOperation,
          });
        } else {
          console.error("Failed to prepare deposit:", res.error);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to prepare deposit", err);
      });
  }, [formData, selectedAccount, network, depositResult, actions]);

  const selectedChannel = useMemo(() => {
    if (!formData || !privateChannels) return undefined;
    return privateChannels.channels.find((c) => c.id === formData.channelId);
  }, [formData, privateChannels]);

  const utxoCount = useMemo(() => {
    if (!formData) return 0;
    return getUtxoCountFromEntropyLevel(formData.entropyLevel);
  }, [formData]);

  // Calculate estimated fee using the same function as deposit.ts
  const estimatedFee = useMemo(() => {
    if (!formData) return "0";
    const fee = getFeeForEntropyLevel(formData.entropyLevel);
    return fee.toFixed(7);
  }, [formData]);

  const totalAmount = useMemo(() => {
    if (!formData) return undefined;
    const amount = parseFloat(formData.amount);
    const fee = parseFloat(estimatedFee);
    return (amount + fee).toFixed(7);
  }, [formData, estimatedFee]);

  const handleSubmit = async () => {
    if (!formData || !selectedAccount) {
      setError("Missing form data or account");
      return;
    }

    setError(undefined);
    setBusy(true);

    try {
      const result = await deposit({
        network,
        channelId: formData.channelId,
        providerId: formData.providerId,
        accountId: selectedAccount.accountId,
        method: formData.method,
        amount: formData.amount,
        entropyLevel: formData.entropyLevel,
        // Use prepared operations if available
        preparedOperationsMLXDR: depositResult?.operationsMLXDR,
      });

      if (!result.ok) {
        setError(result.error?.message ?? "Deposit failed");
        return;
      }

      // Clear form data and go home
      actions.clearDepositData();
      actions.goHome();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!formData) {
    return (
      <DepositReviewTemplate
        channelName=""
        accountName={selectedAccount?.name ?? ""}
        method="DIRECT"
        amount="0"
        entropyLevel="MEDIUM"
        utxoCount={0}
        estimatedFee={undefined}
        totalAmount={undefined}
        busy={false}
        error="Missing form data. Please start over."
        onBack={() => actions.goHome()}
        onSubmit={() => {}}
      />
    );
  }

  return (
    <DepositReviewTemplate
      channelName={selectedChannel?.name ?? "Unknown Channel"}
      accountName={selectedAccount?.name ?? "Unknown Account"}
      method={formData.method}
      amount={formData.amount}
      entropyLevel={formData.entropyLevel}
      utxoCount={utxoCount}
      estimatedFee={estimatedFee}
      totalAmount={totalAmount}
      createOperations={depositResult?.createOperations}
      depositOperation={depositResult?.depositOperation}
      busy={busy}
      error={error}
      onBack={() => actions.goDeposit()}
      onSubmit={handleSubmit}
    />
  );
}
