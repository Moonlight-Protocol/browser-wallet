import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { privateChannels, vault } from "@/background/session.ts";
import {
  PrivacyProviderAuthError,
  PrivacyProviderClient,
} from "@/background/services/privacy-provider-client.ts";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";
import { Keys } from "@/keys/keys.ts";
import {
  ChannelReadMethods,
  ChannelSpec,
  MoonlightOperation,
  PrivacyChannel,
  StellarDerivator,
  StellarNetworkId,
  UtxoBasedStellarAccount,
  type UTXOKeypair,
  UTXOStatus,
} from "@moonlight/moonlight-sdk";
import {
  Contract,
  type ContractId,
  type Ed25519SecretKey,
  type Ed25519PublicKey,
  fromDecimals,
  StrKey,
} from "@colibri/core";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type {
  EntropyLevel,
  PrepareWithdrawRequest,
  WithdrawRequest,
} from "@/background/handlers/private/withdraw.types.ts";
import { partitionAmountRandom } from "@/background/utils/random-partition.ts";
import { Buffer } from "node:buffer";
import { bytesToBase64 } from "@/common/utils/bytes-to-base64.ts";

async function rpcGetLatestLedger(params: { rpcUrl: string }) {
  const res = await fetch(params.rpcUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getLatestLedger",
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`RPC invalid JSON: ${text.slice(0, 500)}`);
  }

  if (typeof json !== "object" || json === null) {
    throw new Error(`RPC invalid response: ${text.slice(0, 500)}`);
  }

  const obj = json as Record<string, unknown>;
  const err = obj["error"];
  if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;
    const errMsg = errObj["message"];
    if (typeof errMsg === "string") throw new Error(errMsg);
    throw new Error(`RPC error: ${JSON.stringify(errObj).slice(0, 500)}`);
  }

  const result = obj["result"] as { sequence?: unknown } | undefined;
  if (!result || typeof result.sequence !== "number") {
    throw new Error(`RPC invalid latest ledger: ${text.slice(0, 500)}`);
  }

  return result as { sequence: number };
}

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

function entropyToNumber(level: EntropyLevel): number {
  switch (level) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 5;
    case "HIGH":
      return 10;
    case "V_HIGH":
      return 15;
    default:
      return 5;
  }
}

type PreparedOperations = {
  withdrawOperation: ReturnType<typeof MoonlightOperation.withdraw>;
  createOperations: ReturnType<typeof MoonlightOperation.create>[];
  spendOperations: ReturnType<typeof MoonlightOperation.spend>[];
  selectedUTXOs: UTXOKeypair[];
  changeAmount: bigint;
  operationsMLXDR: string[];
  totalSpendAmount: bigint;
  withdrawAmount: bigint;
};

/**
 * Prepares all operations for a withdraw transaction without submitting to provider.
 * This includes validating destination address, selecting UTXOs, building WITHDRAW,
 * CREATE (for change), and SPEND operations, and signing them.
 */
async function prepareWithdrawOperations(
  params: PrepareWithdrawRequest,
): Promise<PreparedOperations> {
  const {
    network,
    channelId,
    providerId,
    accountId,
    destinationAddress,
    amount,
    entropyLevel,
  } = params;

  // 1. Validate wallet is unlocked
  if (vault.isLocked()) {
    throw new Error("Wallet is locked");
  }

  // 2. Get channel and provider
  const channels = privateChannels.getChannels(network);
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) {
    throw new Error("Channel not found");
  }

  const provider = channel.providers.find((p) => p.id === providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  // 3. Validate session exists and has a valid token
  const session = provider.sessions?.[accountId];
  if (!session) {
    throw new Error(
      "Provider session not found. Please connect to the provider.",
    );
  }

  if (!session.token || typeof session.token !== "string") {
    throw new Error(
      "Provider session token is missing. Please reconnect to the provider.",
    );
  }

  // 4. Validate destination address (G account)
  if (!StrKey.isValidEd25519PublicKey(destinationAddress)) {
    throw new Error("Invalid destination address: Must be a valid Stellar public key");
  }

  // 5. Get account and secret key
  const state = vault.store.getValue();
  const found = state.wallets
    .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
    .find((x) => x.account.id === accountId);

  if (!found) {
    throw new Error("Account not found");
  }

  const secretKey: Ed25519SecretKey = found.wallet.type === "secret"
    ? found.account.type === "imported"
      ? (found.account.secret as Ed25519SecretKey)
      : (() => {
        throw new Error("Invalid account type for secret wallet");
      })()
    : ((
      await Keys.deriveStellarAccountFromMnemonic(
        found.wallet.mnemonic,
        found.account.type === "derived" ? found.account.index : 0,
      )
    ).secret as Ed25519SecretKey);

  // 6. Get network config and asset contract ID
  const networkConfig = getNetworkConfig(network);
  const channelContract = new Contract({
    networkConfig,
    contractConfig: {
      contractId: channel.contractId as ContractId,
      spec: ChannelSpec,
    },
  });

  const assetContractId = (await channelContract.read({
    method: ChannelReadMethods.asset,
    methodArgs: {},
  })) as ContractId;

  // 7. Convert amounts to BigInt
  const parsedAmount = Number.parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Invalid withdraw amount");
  }

  const feeAmount = getFeeForEntropyLevel(entropyLevel);
  const amountBigInt = fromDecimals(parsedAmount, 7);
  const feesBigInt = fromDecimals(feeAmount, 7);

  // Calculate total we need to spend (amount + fees)
  const totalToSpend = amountBigInt + feesBigInt;

  // 8. Setup UTXO account handler
  const stellarDerivator = new StellarDerivator().withNetworkAndContract(
    networkConfig.networkPassphrase as StellarNetworkId,
    channel.contractId as ContractId,
  );

  const contractClient = new PrivacyChannel(
    networkConfig,
    channel.contractId as ContractId,
    channel.quorumContractId as ContractId,
    assetContractId,
  );

  const accountHandler = new UtxoBasedStellarAccount({
    root: secretKey as Ed25519SecretKey,
    derivator: stellarDerivator,
    options: {
      batchSize: 50,
      fetchBalances(publicKeys) {
        return contractClient.read({
          method: ChannelReadMethods.utxo_balances,
          methodArgs: { utxos: publicKeys.map((pk) => Buffer.from(pk)) },
        });
      },
    },
  });

  // 9. Ensure enough free UTXOs
  const minFreeUtxos = 10; // Reasonable minimum for withdraw operations
  let safetyCounter = 0;
  while (
    accountHandler.getUTXOsByState(UTXOStatus.FREE).length < minFreeUtxos &&
    safetyCounter < 10
  ) {
    await accountHandler.deriveBatch({});
    await accountHandler.batchLoad();
    safetyCounter += 1;
  }

  // 10. Select UTXOs for transfer
  const MAX_RETRIES = 5;
  const MAX_UTXOS_PREFERRED = 10;
  let bestSelection: {
    selectedUTXOs: UTXOKeypair[];
    totalAmount: bigint;
    changeAmount: bigint;
  } | null = null;
  let smallestUTXOCount = Infinity;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const selection = accountHandler.selectUTXOsForTransfer(
      totalToSpend,
      "random" as unknown as Parameters<
        typeof accountHandler.selectUTXOsForTransfer
      >[1],
    );

    if (!selection) {
      break;
    }

    const utxoCount = selection.selectedUTXOs.length;

    if (utxoCount < smallestUTXOCount) {
      smallestUTXOCount = utxoCount;
      bestSelection = selection;
    }

    if (utxoCount <= MAX_UTXOS_PREFERRED) {
      break;
    }
  }

  if (!bestSelection) {
    throw new Error(
      `Insufficient balance. Need ${Number(totalToSpend) / 1e7} XLM`,
    );
  }

  const { selectedUTXOs, totalAmount: totalSpendAmount, changeAmount } =
    bestSelection;

  // 11. Calculate entropy/slots
  const targetSlots = entropyToNumber(entropyLevel);
  const spendCount = selectedUTXOs.length;
  const usedSlots = 1 + spendCount; // 1 for WITHDRAW operation

  // Determine how many CREATE operations to add for change
  let changeCreateCount = 1; // At minimum, 1 create for change

  if (targetSlots > usedSlots && changeAmount > BigInt(0)) {
    // We have extra slots - use them to split the change
    changeCreateCount = targetSlots - usedSlots;
  }

  // 12. Create WITHDRAW operation
  const destinationPublicKey = destinationAddress as Ed25519PublicKey;
  const withdrawOp = MoonlightOperation.withdraw(
    destinationPublicKey,
    amountBigInt,
  );

  // 13. Build CREATE operations for change
  const createOperations: ReturnType<typeof MoonlightOperation.create>[] = [];

  // Add change CREATE operations if there's change
  if (changeAmount > BigInt(0)) {
    const changeUTXOs = accountHandler.reserveUTXOs(changeCreateCount);
    if (changeUTXOs && changeUTXOs.length > 0) {
      // Split change randomly across the reserved UTXOs
      const MIN_PER_UTXO = 1n;
      const amounts = partitionAmountRandom(
        changeAmount,
        changeCreateCount,
        { minPerPart: MIN_PER_UTXO },
      );

      for (let i = 0; i < changeCreateCount; i++) {
        const changeUTXO = changeUTXOs[i];
        const amountForChange = amounts[i];

        if (amountForChange <= 0n) continue;

        const changeCreateOp = MoonlightOperation.create(
          changeUTXO.publicKey,
          amountForChange,
        );
        createOperations.push(changeCreateOp);
      }
    }
  }

  // 14. Get expiration for signing
  const rpcUrl = String(networkConfig.rpcUrl);
  const latestLedger = await rpcGetLatestLedger({ rpcUrl });
  const expiration = latestLedger.sequence + 1000;

  // 15. Build SPEND operations and add WITHDRAW + CREATE operations as conditions
  const spendOperations: ReturnType<typeof MoonlightOperation.spend>[] = [];

  for (const utxo of selectedUTXOs) {
    const spendOp = MoonlightOperation.spend(utxo.publicKey);

    // Add WITHDRAW operation as condition
    spendOp.addCondition(withdrawOp.toCondition());

    // Add all CREATE operations (change) as conditions to this spend
    for (const createOp of createOperations) {
      spendOp.addCondition(createOp.toCondition());
    }

    // Sign the spend operation with the UTXO's keypair
    await spendOp.signWithUTXO(
      utxo,
      channel.contractId as ContractId,
      expiration,
    );

    spendOperations.push(spendOp);
  }

  // 16. Convert all operations to MLXDR
  // Order: WITHDRAW first, then CREATE (change), then SPEND
  const operationsMLXDR: string[] = [
    ...createOperations.map((op) => op.toMLXDR()),
    ...spendOperations.map((op) => op.toMLXDR()),
    withdrawOp.toMLXDR(),
  ];

  return {
    withdrawOperation: withdrawOp,
    createOperations,
    spendOperations,
    selectedUTXOs,
    changeAmount,
    operationsMLXDR,
    totalSpendAmount,
    withdrawAmount: amountBigInt,
  };
}

export const handlePrepareWithdraw: Handler<MessageType.PrepareWithdraw> =
  async (message) => {
    const params = message as PrepareWithdrawRequest & {
      type: MessageType.PrepareWithdraw;
    };

    try {
      const prepared = await prepareWithdrawOperations(params);

      // Serialize operations for frontend
      const changeOperations = prepared.createOperations.map((op) => ({
        publicKey: bytesToBase64(op.getUtxo()),
        amount: op.getAmount().toString(),
        type: "change" as const,
      }));

      const spendOperations = prepared.spendOperations.map((op) => ({
        utxoPublicKey: bytesToBase64(op.getUtxo()),
        // Conditions count: 1 (WITHDRAW) + number of change CREATEs
        conditionsCount: 1 + prepared.createOperations.length,
      }));

      return {
        type: MessageType.PrepareWithdraw,
        ok: true,
        withdrawOperation: {
          destinationAddress: params.destinationAddress,
          amount: prepared.withdrawAmount.toString(),
        },
        changeOperations,
        spendOperations,
        operationsMLXDR: prepared.operationsMLXDR,
        totalSpendAmount: prepared.totalSpendAmount.toString(),
        changeAmount: prepared.changeAmount.toString(),
        withdrawAmount: prepared.withdrawAmount.toString(),
        numSpends: prepared.spendOperations.length,
        numCreates: prepared.createOperations.length,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[prepareWithdraw] Error:", msg);
      return {
        type: MessageType.PrepareWithdraw,
        ok: false,
        error: {
          code: "PREPARE_WITHDRAW_FAILED",
          message: msg,
        },
      };
    }
  };

async function submitPreparedOperations(
  operationsMLXDR: string[],
  params: {
    network: ChainNetwork;
    channelId: string;
    providerId: string;
    accountId: string;
  },
): Promise<{
  type: MessageType.Withdraw;
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
}> {
  const { network, channelId, providerId, accountId } = params;

  // Get channel and provider
  const channels = privateChannels.getChannels(network);
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) {
    return {
      type: MessageType.Withdraw,
      ok: false,
      error: { code: "NOT_FOUND", message: "Channel not found" },
    };
  }

  const provider = channel.providers.find((p) => p.id === providerId);
  if (!provider) {
    return {
      type: MessageType.Withdraw,
      ok: false,
      error: { code: "NOT_FOUND", message: "Provider not found" },
    };
  }

  // Validate session
  const session = provider.sessions?.[accountId];
  if (!session) {
    return {
      type: MessageType.Withdraw,
      ok: false,
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Provider session not found. Please connect to the provider.",
      },
    };
  }

  if (!session.token || typeof session.token !== "string") {
    return {
      type: MessageType.Withdraw,
      ok: false,
      error: {
        code: "INVALID_SESSION",
        message:
          "Provider session token is missing. Please reconnect to the provider.",
      },
    };
  }

  // Submit bundle to provider
  const client = new PrivacyProviderClient(provider.url);
  try {
    const result = await client.submitBundle({
      token: session.token,
      operationsMLXDR,
    });

    return {
      type: MessageType.Withdraw,
      ok: true,
      id: result.id,
      hash: result.hash,
    };
  } catch (bundleError: unknown) {
    // Handle authentication errors
    if (bundleError instanceof PrivacyProviderAuthError) {
      await privateChannels.clearProviderSession(
        network,
        channelId,
        providerId,
        accountId,
      );

      return {
        type: MessageType.Withdraw,
        ok: false,
        error: {
          code: "AUTH_FAILED",
          message: bundleError.message,
        },
      };
    }

    throw bundleError;
  }
}

export const handleWithdraw: Handler<MessageType.Withdraw> = async (
  message,
) => {
  const {
    network,
    channelId,
    providerId,
    accountId,
    destinationAddress,
    amount,
    entropyLevel,
    preparedOperationsMLXDR,
  } = message as WithdrawRequest & { type: MessageType.Withdraw };

  try {
    // If operations are already prepared, just submit them
    if (preparedOperationsMLXDR && preparedOperationsMLXDR.length > 0) {
      return await submitPreparedOperations(
        preparedOperationsMLXDR,
        { network, channelId, providerId, accountId },
      );
    }

    // Otherwise, prepare and submit (backward compatibility)
    const prepared = await prepareWithdrawOperations({
      network,
      channelId,
      providerId,
      accountId,
      destinationAddress: destinationAddress!,
      amount: amount!,
      entropyLevel: entropyLevel!,
    });

    return await submitPreparedOperations(
      prepared.operationsMLXDR,
      { network, channelId, providerId, accountId },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[withdraw] Error:", msg);
    return {
      type: MessageType.Withdraw,
      ok: false,
      error: {
        code: "WITHDRAW_FAILED",
        message: msg,
      },
    };
  }
};
