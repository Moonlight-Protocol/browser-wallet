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
  fromDecimals,
} from "@colibri/core";
import type {
  EntropyLevel,
  SendRequest,
} from "@/background/handlers/private/send.types.ts";
import { partitionAmountRandom } from "@/background/utils/random-partition.ts";
import { Buffer } from "node:buffer";

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

export const handleSend: Handler<MessageType.Send> = async (message) => {
  const {
    network,
    channelId,
    providerId,
    accountId,
    receiverOperationsMLXDR,
    amount,
    entropyLevel,
  } = message as SendRequest & { type: MessageType.Send };

  try {
    // 1. Validate wallet is unlocked
    if (vault.isLocked()) {
      return {
        type: MessageType.Send,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    // 2. Get channel and provider
    const channels = privateChannels.getChannels(network);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      return {
        type: MessageType.Send,
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      };
    }

    const provider = channel.providers.find((p) => p.id === providerId);
    if (!provider) {
      return {
        type: MessageType.Send,
        ok: false,
        error: { code: "NOT_FOUND", message: "Provider not found" },
      };
    }

    // 3. Validate session exists and has a valid token
    const session = provider.sessions?.[accountId];
    if (!session) {
      return {
        type: MessageType.Send,
        ok: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message:
            "Provider session not found. Please connect to the provider.",
        },
      };
    }

    if (!session.token || typeof session.token !== "string") {
      return {
        type: MessageType.Send,
        ok: false,
        error: {
          code: "INVALID_SESSION",
          message:
            "Provider session token is missing. Please reconnect to the provider.",
        },
      };
    }

    // 4. Parse MLXDR to get receiver operations
    const operationStrings = receiverOperationsMLXDR
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (operationStrings.length === 0) {
      return {
        type: MessageType.Send,
        ok: false,
        error: {
          code: "INVALID_MLXDR",
          message: "No operations found in receiving address",
        },
      };
    }

    const receiverOperations: Array<{ publicKey: Uint8Array; amount: bigint }> =
      [];
    let totalReceiverAmount = 0n;

    for (const opMLXDR of operationStrings) {
      try {
        const op = MoonlightOperation.fromMLXDR(opMLXDR);

        // Verify it's a Create operation
        if (!op.isCreate()) {
          return {
            type: MessageType.Send,
            ok: false,
            error: {
              code: "INVALID_MLXDR",
              message:
                "Invalid receiving address: Only CREATE operations are allowed",
            },
          };
        }

        const utxoPublicKey = op.getUtxo(); // Returns Uint8Array
        const opAmount = op.getAmount();

        receiverOperations.push({
          publicKey: utxoPublicKey,
          amount: opAmount,
        });

        totalReceiverAmount += opAmount;
      } catch (parseError) {
        return {
          type: MessageType.Send,
          ok: false,
          error: {
            code: "INVALID_MLXDR",
            message: `Failed to parse MLXDR operation: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`,
          },
        };
      }
    }

    if (receiverOperations.length === 0) {
      return {
        type: MessageType.Send,
        ok: false,
        error: {
          code: "INVALID_MLXDR",
          message: "No valid CREATE operations found in receiving address",
        },
      };
    }

    // 5. Get account and secret key
    const state = vault.store.getValue();
    const found = state.wallets
      .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
      .find((x) => x.account.id === accountId);

    if (!found) {
      return {
        type: MessageType.Send,
        ok: false,
        error: { code: "NOT_FOUND", message: "Account not found" },
      };
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
      return {
        type: MessageType.Send,
        ok: false,
        error: { code: "INVALID_AMOUNT", message: "Invalid send amount" },
      };
    }

    const feeAmount = getFeeForEntropyLevel(entropyLevel);
    const amountBigInt = fromDecimals(parsedAmount, 7);
    const feesBigInt = fromDecimals(feeAmount, 7);

    // Calculate total we need to spend (amount + fees)
    const totalToSpend = amountBigInt + feesBigInt;

    // // Cap the maximum value to select at 2x the actual need for obfuscation
    // const maxValueToSelect = totalToSpend * BigInt(2);

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
    const minFreeUtxos = 10; // Reasonable minimum for send operations
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
    // Use SDK's selectUTXOsForTransfer directly on UtxoBasedStellarAccount
    // Try up to 5 times to get a selection with 10 or fewer UTXOs
    const MAX_RETRIES = 5;
    const MAX_UTXOS_PREFERRED = 10;
    let bestSelection: {
      selectedUTXOs: UTXOKeypair[];
      totalAmount: bigint;
      changeAmount: bigint;
    } | null = null;
    let smallestUTXOCount = Infinity;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // SDK doesn't export UTXOSelectionStrategy enum, so we use string literal
      // RANDOM strategy = 1 in SDK enum
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

      // Keep track of the best selection (fewest UTXOs)
      if (utxoCount < smallestUTXOCount) {
        smallestUTXOCount = utxoCount;
        bestSelection = selection;
      }

      // If we found a selection with 10 or fewer UTXOs, use it immediately
      if (utxoCount <= MAX_UTXOS_PREFERRED) {
        break;
      }
    }

    if (!bestSelection) {
      return {
        type: MessageType.Send,
        ok: false,
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: `Insufficient balance. Need ${
            Number(totalToSpend) / 1e7
          } XLM`,
        },
      };
    }

    const { selectedUTXOs, changeAmount } = bestSelection;

    // 11. Calculate entropy/slots
    const targetSlots = entropyToNumber(entropyLevel);
    const receiverCreateCount = receiverOperations.length;
    const spendCount = selectedUTXOs.length;
    const usedSlots = receiverCreateCount + spendCount;

    // Determine how many CREATE operations to add for change
    let changeCreateCount = 1; // At minimum, 1 create for change

    if (targetSlots > usedSlots && changeAmount > BigInt(0)) {
      // We have extra slots - use them to split the change
      changeCreateCount = targetSlots - usedSlots;
    }

    // 12. Build CREATE operations (receiver + change)
    const createOperations: ReturnType<typeof MoonlightOperation.create>[] = [];

    // Add receiver's CREATE operations
    for (const op of receiverOperations) {
      const createOp = MoonlightOperation.create(op.publicKey, op.amount);
      createOperations.push(createOp);
    }

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

    // 13. Get expiration for signing
    const rpcUrl = String(networkConfig.rpcUrl);
    const latestLedger = await rpcGetLatestLedger({ rpcUrl });
    const expiration = latestLedger.sequence + 1000;

    // 14. Build SPEND operations and add CREATE operations as conditions
    const spendOperations: ReturnType<typeof MoonlightOperation.spend>[] = [];

    for (const utxo of selectedUTXOs) {
      const spendOp = MoonlightOperation.spend(utxo.publicKey);

      // Add all CREATE operations as conditions to this spend
      for (const createOp of createOperations) {
        spendOp.addCondition(createOp.toCondition());
      }

      // Sign the spend operation with the UTXO's keypair
      await spendOp.signWithUTXO(
        utxo, // The UTXOKeypair from selectUTXOsForTransfer
        channel.contractId as ContractId,
        expiration,
      );

      spendOperations.push(spendOp);
    }

    console.log("spendOperations", spendOperations);
    console.log("createOperations", createOperations);

    // 15. Convert all operations to MLXDR
    const operationsMLXDR: string[] = [
      ...createOperations.map((op) => op.toMLXDR()),
      ...spendOperations.map((op) => op.toMLXDR()),
    ];

    // 16. Submit bundle to provider
    const client = new PrivacyProviderClient(provider.url);
    try {
      const result = await client.submitBundle({
        token: session.token,
        operationsMLXDR,
      });

      return {
        type: MessageType.Send,
        ok: true,
        id: result.id,
        hash: result.hash,
      };
    } catch (bundleError: unknown) {
      // Handle authentication errors - clear session and return specific error
      if (bundleError instanceof PrivacyProviderAuthError) {
        await privateChannels.clearProviderSession(
          network,
          channelId,
          providerId,
          accountId,
        );

        return {
          type: MessageType.Send,
          ok: false,
          error: {
            code: "AUTH_FAILED",
            message: bundleError.message,
          },
        };
      }

      // Re-throw other errors to be caught by outer catch
      throw bundleError;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send] Error:", msg);
    return {
      type: MessageType.Send,
      ok: false,
      error: {
        code: "SEND_FAILED",
        message: msg,
      },
    };
  }
};
