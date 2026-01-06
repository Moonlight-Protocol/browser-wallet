import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels, privateUtxos, vault } from "@/background/session.ts";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";
import { Keys } from "@/keys/keys.ts";
import { bytesToBase64 } from "@/common/utils/bytes-to-base64.ts";
import {
  ChannelReadMethods,
  ChannelSpec,
  PrivacyChannel,
  UtxoBasedStellarAccount,
  type UTXOKeypair,
} from "@moonlight/moonlight-sdk";
import {
  Contract,
  type ContractId,
  type Ed25519SecretKey,
  type NetworkConfig,
} from "@colibri/core";

export const handleEnsurePrivateChannelTracking = async (
  message: MessageFor<MessageType.EnsurePrivateChannelTracking>
): Promise<ResponseFor<MessageType.EnsurePrivateChannelTracking>> => {
  console.info("[private][ensure-tracking] request", {
    network: message.network,
    accountId: message.accountId,
    channelId: message.channelId,
    targetUtxos: message.targetUtxos,
  });
  try {
    const channels = privateChannels.getChannels(message.network);
    const channel = channels.find((c) => c.id === message.channelId);
    if (!channel) {
      return {
        type: MessageType.EnsurePrivateChannelTracking,
        ok: false,
        error: { code: "UNKNOWN", message: "Channel not found" },
      };
    }

    const targetCount = Math.max(1, Math.floor(message.targetUtxos ?? 300));

    privateUtxos.ensureTracking({
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
      contractId: channel.contractId,
      quorumContractId: channel.quorumContractId,
      asset: channel.asset,
      targetCount,
    });

    const _existingTracking = privateUtxos.getTracking({
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
    });

    if (vault.isLocked()) {
      console.warn("[private][ensure-tracking] blocked: vault locked", {
        network: message.network,
        accountId: message.accountId,
        channelId: message.channelId,
      });
      return {
        type: MessageType.EnsurePrivateChannelTracking,
        ok: false,
        error: { code: "UNKNOWN", message: "Wallet is locked" },
      };
    }

    const state = vault.store.getValue();
    const found = state.wallets
      .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
      .find((x) => x.account.id === message.accountId);

    if (!found) {
      return {
        type: MessageType.EnsurePrivateChannelTracking,
        ok: false,
        error: { code: "UNKNOWN", message: "Account not found" },
      };
    }

    const secretKey: Ed25519SecretKey =
      found.wallet.type === "secret"
        ? found.account.type === "imported"
          ? (found.account.secret as Ed25519SecretKey)
          : (() => {
              throw new Error("Invalid account type for secret wallet");
            })()
        : ((
            await Keys.deriveStellarAccountFromMnemonic(
              found.wallet.mnemonic,
              found.account.type === "derived" ? found.account.index : 0
            )
          ).secret as Ed25519SecretKey);

    const networkConfig: NetworkConfig = getNetworkConfig(message.network);

    const channelContract = new Contract({
      networkConfig,
      contractConfig: {
        contractId: channel.contractId as ContractId,
        spec: ChannelSpec,
      },
    });

    const assetId = await channelContract.read({
      method: ChannelReadMethods.asset,
      methodArgs: {},
    });

    // We store the "auth contract" as quorum contract id in our app.
    const quorumContractId = channel.quorumContractId.trim();
    if (!quorumContractId) {
      return {
        type: MessageType.EnsurePrivateChannelTracking,
        ok: false,
        error: { code: "UNKNOWN", message: "Quorum contract id is required" },
      };
    }

    const channelClient = new PrivacyChannel(
      networkConfig,
      channel.contractId as ContractId,
      quorumContractId as ContractId,
      assetId as ContractId
    );

    const utxoAccount = UtxoBasedStellarAccount.fromPrivacyChannel({
      channelClient,
      root: secretKey,
      options: {
        startIndex: 0,
        batchSize: 50,
      },
    });

    // Do this in chunks so MV3 service worker + popup messaging stays responsive.
    const chunkSize = 50;
    for (
      let startIndex = 0;
      startIndex < targetCount;
      startIndex += chunkSize
    ) {
      const count = Math.min(chunkSize, targetCount - startIndex);
      await utxoAccount.deriveBatch({ startIndex, count });
    }

    await utxoAccount.batchLoad();

    const all = utxoAccount.getAllUTXOs() as unknown as Array<
      UTXOKeypair<string, `${number}`>
    >;
    const snapshotUtxos = all.map((u) => ({
      index: Number(u.index),
      utxoPublicKey: bytesToBase64(u.publicKey),
      balance: u.balance.toString(),
    }));

    privateUtxos.applyMoonlightSnapshot({
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
      targetCount,
      utxos: snapshotUtxos,
      nextIndex: targetCount,
    });

    await privateUtxos.flush();

    const stats = privateUtxos.getStats({
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
    });

    console.info("[private][ensure-tracking] success", {
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
      utxoCount: stats?.utxos?.length,
      totalBalance: stats?.totalBalance,
      derivedCount: stats?.derivedCount,
    });

    return {
      type: MessageType.EnsurePrivateChannelTracking,
      ok: true,
      stats: stats ?? {
        targetCount,
        derivedCount: 0,
        nonZeroCount: 0,
        totalBalance: "0",
        updatedAt: Date.now(),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[private][ensure-tracking] failure", {
      network: message.network,
      accountId: message.accountId,
      channelId: message.channelId,
      error: msg,
    });
    return {
      type: MessageType.EnsurePrivateChannelTracking,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
