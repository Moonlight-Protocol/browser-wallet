import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { privateChannels, vault } from "@/background/session.ts";
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
  type Ed25519SecretKey,
  fromDecimals,
} from "@colibri/core";
import type {
  ReceiveRequest,
} from "@/background/handlers/private/receive.types.ts";
import { partitionAmountRandom } from "@/background/utils/random-partition.ts";
import { Buffer } from "node:buffer";
import { bytesToBase64 } from "@/common/utils/bytes-to-base64.ts";

/**
 * Fixed number of UTXOs for receive operations.
 * This provides optimal privacy and QR code size.
 */
const NUM_UTXOS = 5;

/**
 * Minimum amount per UTXO (in stroops)
 */
const MIN_PER_UTXO = 1n;

export const handleReceive: Handler<MessageType.Receive> = async (message) => {
  const {
    network,
    channelId,
    providerId,
    accountId,
    amount,
  } = message as ReceiveRequest & { type: MessageType.Receive };

  try {
    // 1. Validate wallet is unlocked
    if (vault.isLocked()) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    // 2. Get channel and provider
    const channels = privateChannels.getChannels(network);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      };
    }

    const provider = channel.providers.find((p) => p.id === providerId);
    if (!provider) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: { code: "NOT_FOUND", message: "Provider not found" },
      };
    }

    // 3. Validate session exists and has a valid token
    // Note: We validate session even though receive doesn't submit a bundle yet,
    // to maintain consistency and future-proofing
    const session = provider.sessions?.[accountId];
    if (!session) {
      return {
        type: MessageType.Receive,
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
        "[receive] Session exists but token is missing or invalid",
        {
          accountId,
          providerId,
          hasToken: !!session.token,
        },
      );
      return {
        type: MessageType.Receive,
        ok: false,
        error: {
          code: "INVALID_SESSION",
          message:
            "Provider session token is missing. Please reconnect to the provider.",
        },
      };
    }

    // 4. Get account and secret key
    const state = vault.store.getValue();
    const found = state.wallets
      .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
      .find((x) => x.account.id === accountId);

    if (!found) {
      return {
        type: MessageType.Receive,
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

    // 6. Parse and validate amount
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: { code: "INVALID_AMOUNT", message: "Invalid deposit amount" },
      };
    }

    const amountBigInt = fromDecimals(parsedAmount, 7);

    // Ensure we have enough amount to distribute across all UTXOs
    if (amountBigInt < BigInt(NUM_UTXOS) * MIN_PER_UTXO) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: {
          code: "INSUFFICIENT_AMOUNT",
          message: `Amount must be at least ${NUM_UTXOS} stroops (${
            NUM_UTXOS / 10_000_000
          } XLM) to distribute across ${NUM_UTXOS} UTXOs`,
        },
      };
    }

    // 7. Setup UTXO account handler (derivation + balances)
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

    // 8. Ensure enough free UTXOs for receive
    const minFreeUtxos = NUM_UTXOS;
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
      return {
        type: MessageType.Receive,
        ok: false,
        error: {
          code: "INSUFFICIENT_UTXOS",
          message: `Not enough UTXOs available. Need ${NUM_UTXOS} free UTXOs.`,
        },
      };
    }

    // 9. Reserve UTXOs for receive
    const reservedUTXOs = accountHandler.reserveUTXOs(NUM_UTXOS);
    if (!reservedUTXOs || reservedUTXOs.length !== NUM_UTXOS) {
      return {
        type: MessageType.Receive,
        ok: false,
        error: {
          code: "RESERVE_FAILED",
          message: `Failed to reserve ${NUM_UTXOS} UTXOs for receive`,
        },
      };
    }

    // 10. Randomly partition the amount to improve privacy
    const amounts = partitionAmountRandom(
      amountBigInt,
      reservedUTXOs.length,
      { minPerPart: MIN_PER_UTXO },
    );

    // 11. Create CREATE operations with randomized amounts
    const createOps = [];
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
      return {
        type: MessageType.Receive,
        ok: false,
        error: {
          code: "CREATE_OPS_FAILED",
          message: "Failed to create UTXO operations for receive",
        },
      };
    }

    // 12. Convert to MLXDR
    const operationsMLXDR = createOps.map((op) => op.toMLXDR());

    // 13. Return receive data
    return {
      type: MessageType.Receive,
      ok: true,
      operationsMLXDR,
      utxos: reservedUTXOs.map((utxo, index) => ({
        publicKey: bytesToBase64(utxo.publicKey),
        amount: amounts[index].toString(),
      })),
      requestedAmount: amount,
      numUtxos: NUM_UTXOS,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[receive] Error:", msg);
    return {
      type: MessageType.Receive,
      ok: false,
      error: {
        code: "RECEIVE_FAILED",
        message: msg,
      },
    };
  }
};
