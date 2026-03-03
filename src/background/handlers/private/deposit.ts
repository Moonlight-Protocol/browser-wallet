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
  UTXOStatus,
} from "@moonlight/moonlight-sdk";
import {
  Contract,
  type ContractId,
  type Ed25519PublicKey,
  type Ed25519SecretKey,
  fromDecimals,
} from "@colibri/core";
import type {
  DepositRequest,
  EntropyLevel,
} from "@/background/handlers/private/deposit.types.ts";
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

function getUtxoCountFromEntropyLevel(level: EntropyLevel): number {
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

function getFeeForEntropyLevel(level: EntropyLevel): number {
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

export const handleDeposit: Handler<MessageType.Deposit> = async (message) => {
  const {
    network,
    channelId,
    providerId,
    accountId,
    amount,
    entropyLevel,
  } = message as DepositRequest & { type: MessageType.Deposit };

  try {
    // 1. Validate wallet is unlocked
    if (vault.isLocked()) {
      return {
        type: MessageType.Deposit,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    // 2. Get channel and provider
    const channels = privateChannels.getChannels(network);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      return {
        type: MessageType.Deposit,
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      };
    }

    const provider = channel.providers.find((p) => p.id === providerId);
    if (!provider) {
      return {
        type: MessageType.Deposit,
        ok: false,
        error: { code: "NOT_FOUND", message: "Provider not found" },
      };
    }

    // 3. Validate session exists and has a valid token
    const session = provider.sessions?.[accountId];
    if (!session) {
      return {
        type: MessageType.Deposit,
        ok: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message:
            "Provider session not found. Please connect to the provider.",
        },
      };
    }

    // Validate token exists in session
    if (!session.token || typeof session.token !== "string") {
      console.error(
        "[deposit] Session exists but token is missing or invalid",
        {
          accountId,
          providerId,
          hasToken: !!session.token,
        },
      );
      return {
        type: MessageType.Deposit,
        ok: false,
        error: {
          code: "INVALID_SESSION",
          message:
            "Provider session token is missing. Please reconnect to the provider.",
        },
      };
    }

    // Note: We don't validate expiresAt locally because:
    // 1. The server is the source of truth for JWT validity
    // 2. The JWT may have a different expiration than our local timestamp
    // 3. If the token is invalid, the server will return an auth error and we'll clear the session

    // 4. Get account and secret key
    const state = vault.store.getValue();
    const found = state.wallets
      .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
      .find((x) => x.account.id === accountId);

    if (!found) {
      return {
        type: MessageType.Deposit,
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

    const accountPublicKey: Ed25519PublicKey = found.account
      .publicKey as Ed25519PublicKey;

    // 5. Get network config and asset contract ID
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

    // TODO: Evolve the fee engine to have move flexibility in the future.
    // Convert human-readable amount and fee to BigInt
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid deposit amount");
    }

    const feeAmount = getFeeForEntropyLevel(entropyLevel);
    const totalAmount = fromDecimals(parsedAmount + feeAmount, 7);

    const amountBigInt = fromDecimals(parsedAmount, 7);
    const utxoCount = getUtxoCountFromEntropyLevel(entropyLevel);

    // 5.1. Calculate expiration using RPC ledger, same as topup flow
    const rpcUrl = String(networkConfig.rpcUrl);
    const latestLedger = await rpcGetLatestLedger({ rpcUrl });
    const expiration = latestLedger.sequence + 1000;

    const keypair = Keys.keypairFromSecret(secretKey);

    // 6. Setup UTXO account handler (derivation + balances)
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

    // 7. Ensure enough free UTXOs for the entropy level
    const minFreeUtxos = utxoCount;
    // Limit iterations to avoid infinite loops in case of issues
    let safetyCounter = 0;
    while (
      accountHandler.getUTXOsByState(UTXOStatus.FREE).length < minFreeUtxos &&
      safetyCounter < 10
    ) {
      await accountHandler.deriveBatch({});
      await accountHandler.batchLoad();
      safetyCounter += 1;
    }

    if (
      accountHandler.getUTXOsByState(UTXOStatus.FREE).length < minFreeUtxos
    ) {
      throw new Error("Not enough UTXOs available for requested entropy level");
    }

    // 8. Reserve UTXOs according to entropy level
    const reservedUTXOs = accountHandler.reserveUTXOs(utxoCount);
    if (!reservedUTXOs) {
      throw new Error("Failed to reserve UTXOs for deposit");
    }

    // 9. Create CREATE operations distributing the total amount among UTXOs
    const createOps = [];
    const MIN_PER_UTXO = 1n;

    // Ensure we have enough amount to distribute across all reserved UTXOs
    if (amountBigInt < BigInt(reservedUTXOs.length) * MIN_PER_UTXO) {
      throw new Error("Insufficient amount to distribute across UTXOs");
    }

    // Randomly partition the amount to improve privacy
    const amounts = partitionAmountRandom(
      amountBigInt,
      reservedUTXOs.length,
      { minPerPart: MIN_PER_UTXO },
    );

    // Create CREATE operations with randomized amounts
    for (let i = 0; i < reservedUTXOs.length; i++) {
      const utxo = reservedUTXOs[i];
      const amountForUtxo = amounts[i];

      if (amountForUtxo <= 0n) continue;

      const createOp = MoonlightOperation.create(
        utxo.publicKey,
        amountForUtxo,
      );

      createOps.push(createOp);
    }

    if (createOps.length === 0) {
      throw new Error("Failed to create UTXO operations for deposit");
    }

    // 10. Create DEPOSIT operation with conditions from CREATE ops
    const depositOp = await MoonlightOperation.deposit(
      accountPublicKey,
      totalAmount,
    )
      .addConditions(createOps.map((op) => op.toCondition()))
      .signWithEd25519(
        keypair,
        expiration,
        channel.contractId as ContractId,
        assetContractId,
        networkConfig.networkPassphrase,
      );

    // 11. Convert to MLXDR (DEPOSIT first, then CREATE)
    const operationsMLXDR = [
      depositOp.toMLXDR(),
      ...createOps.map((op) => op.toMLXDR()),
    ];

    console.log("operationsMLXDR", operationsMLXDR);

    // 12. Submit bundle to provider
    const client = new PrivacyProviderClient(provider.url);
    try {
      const result = await client.submitBundle({
        token: session.token,
        operationsMLXDR,
      });

      return {
        type: MessageType.Deposit,
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
          type: MessageType.Deposit,
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
    console.error("[deposit] Error:", msg);
    return {
      type: MessageType.Deposit,
      ok: false,
      error: {
        code: "DEPOSIT_FAILED",
        message: msg,
      },
    };
  }
};
