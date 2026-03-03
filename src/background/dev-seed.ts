/**
 * Dev seed: auto-configures the wallet on first install when build-time
 * seed config is present. Runs once in the background service worker.
 *
 * All __SEED_* constants are injected by esbuild `define` from .env.seed.
 */

import { ensureSessionHydrated, unlockVault } from "@/background/session.ts";
import { meta, vault, privateChannels } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import { Contract, type ContractId } from "@colibri/core";
import { ChannelReadMethods, ChannelSpec } from "@moonlight/moonlight-sdk";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";
import { PrivacyProviderClient } from "@/background/services/privacy-provider-client.ts";
import { requestFriendbotFunding } from "@/background/contexts/chain/friendbot.ts";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import type { Ed25519PublicKey } from "@colibri/core";
import type {
  DerivedAccount,
  MnemonicWallet,
} from "@/persistence/stores/vault.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

declare const __SEED_PASSWORD__: string;
declare const __SEED_MNEMONIC__: string;
declare const __SEED_NETWORK__: string;
declare const __SEED_CHANNEL_CONTRACT_ID__: string;
declare const __SEED_CHANNEL_NAME__: string;
declare const __SEED_ASSET_CODE__: string;
declare const __SEED_ASSET_ISSUER__: string;
declare const __SEED_PROVIDERS__: string;

const SEED_MARKER_KEY = "dev-seed.applied";

export async function applyDevSeed(): Promise<void> {
  // Guard: only run if seed config was injected
  if (!__SEED_PASSWORD__ || !__SEED_MNEMONIC__) {
    return;
  }

  await ensureSessionHydrated();

  // Check if seed was already applied
  const marker = await chrome.storage.local.get(SEED_MARKER_KEY);
  if (marker[SEED_MARKER_KEY]) {
    console.log("[dev-seed] Already applied, skipping");
    return;
  }

  console.log("[dev-seed] Applying seed configuration...");

  const password = __SEED_PASSWORD__;
  const mnemonic = __SEED_MNEMONIC__;
  const network = (__SEED_NETWORK__ || "testnet") as ChainNetwork;

  // 1. Unlock vault (creates encryption salt on first run)
  await unlockVault({ password, ttlMs: 60 * 60 * 1000 });

  // 2. Import mnemonic wallet (if vault is empty)
  let accountId: string | undefined;
  let publicKey: string | undefined;

  const vaultState = vault.store.getValue();
  if (vaultState.wallets.length === 0) {
    const account = await Keys.deriveStellarAccountFromMnemonic(mnemonic, 0);
    publicKey = account.publicKey;

    const wallet: MnemonicWallet = {
      id: crypto.randomUUID(),
      type: "mnemonic",
      name: "Account 1",
      mnemonic,
      accounts: [
        {
          id: crypto.randomUUID(),
          type: "derived",
          name: "Account 1",
          publicKey: publicKey as Ed25519PublicKey,
          derivationPath: account.derivationPath,
          index: account.index,
        } satisfies DerivedAccount,
      ],
    };

    vault.store.update((prev) => ({
      ...prev,
      wallets: [...prev.wallets, wallet],
    }));
    await vault.flush();

    accountId = wallet.accounts[0].id;

    meta.setMainKey({
      walletId: wallet.id,
      accountId,
    });
    meta.setLastSelectedAccount({
      walletId: wallet.id,
      accountId,
    });
    meta.setLastSelectedNetwork(network);
    await meta.flush();

    console.log("[dev-seed] Wallet imported, publicKey:", publicKey);

    // Fund account via Friendbot (testnet/futurenet only)
    try {
      const networkConfig = getNetworkConfig(network);
      if (networkConfig.friendbotUrl) {
        await requestFriendbotFunding({
          networkConfig,
          publicKey: publicKey as Ed25519PublicKey,
        });
        console.log("[dev-seed] Account funded via Friendbot");
      }
    } catch (err) {
      console.warn("[dev-seed] Friendbot funding failed (may already be funded):", err);
    }
  } else {
    // Use existing first account
    const firstWallet = vaultState.wallets[0];
    const firstAccount = firstWallet.accounts[0];
    accountId = firstAccount.id;
    publicKey = firstAccount.publicKey;
  }

  // 3. Add privacy channel (if none exist for this network)
  const existingChannels =
    privateChannels.getChannels(network) ?? [];
  let channelId: string;

  if (
    existingChannels.length === 0 && __SEED_CHANNEL_CONTRACT_ID__
  ) {
    // Fetch quorum contract ID from the channel contract
    let quorumContractId = "";
    try {
      const networkConfig = getNetworkConfig(network);
      const channelContract = new Contract({
        networkConfig,
        contractConfig: {
          contractId: __SEED_CHANNEL_CONTRACT_ID__ as ContractId,
          spec: ChannelSpec,
        },
      });
      quorumContractId = (await channelContract.read({
        method: ChannelReadMethods.auth,
        methodArgs: {},
      })) as string;
      console.log("[dev-seed] Fetched quorum contract ID:", quorumContractId);
    } catch (e) {
      console.error("[dev-seed] Failed to fetch quorum contract ID:", e);
      // Cannot proceed without it
      return;
    }

    const id = crypto.randomUUID();
    const channel = privateChannels.addChannel({
      id,
      name: __SEED_CHANNEL_NAME__ || "Seeded Channel",
      network,
      contractId: __SEED_CHANNEL_CONTRACT_ID__,
      quorumContractId,
      asset: {
        code: __SEED_ASSET_CODE__ || "XLM",
        issuer: __SEED_ASSET_ISSUER__ || undefined,
      },
    });
    privateChannels.setSelectedChannelId(network, channel.id);
    channelId = channel.id;
    console.log("[dev-seed] Channel added:", channel.id);
  } else {
    channelId = existingChannels[0]?.id ?? "";
  }

  // 4. Add privacy providers
  let firstProviderId: string | undefined;

  if (channelId && __SEED_PROVIDERS__) {
    const channel = privateChannels.getChannels(network)?.find(
      (c) => c.id === channelId,
    );
    const existingUrls = new Set(channel?.providers.map((p) => p.url) ?? []);

    const providerEntries = __SEED_PROVIDERS__.split(",").map((entry) => {
      const eqIdx = entry.indexOf("=");
      return {
        name: entry.slice(0, eqIdx).trim(),
        url: entry.slice(eqIdx + 1).trim(),
      };
    });

    for (const { name, url } of providerEntries) {
      if (!url || existingUrls.has(url)) continue;
      const providerId = crypto.randomUUID();
      privateChannels.addProvider(network, channelId, {
        id: providerId,
        name,
        url,
      });
      if (!firstProviderId) firstProviderId = providerId;
      console.log("[dev-seed] Provider added:", name, url);
    }
  }

  await privateChannels.flush();

  // 5. Auto-connect to the first provider
  if (firstProviderId && accountId && publicKey && channelId) {
    try {
      const channel = privateChannels.getChannels(network)?.find(
        (c) => c.id === channelId,
      );
      const provider = channel?.providers.find(
        (p) => p.id === firstProviderId,
      );

      if (provider) {
        console.log("[dev-seed] Auto-connecting to provider:", provider.name);

        // Get auth challenge
        const client = new PrivacyProviderClient(provider.url);
        const challenge = await client.getAuthChallenge(publicKey);

        // Sign the challenge directly using the mnemonic
        const keypair = await Keys.deriveStellarKeypairFromMnemonic(mnemonic, 0);
        const networkConfig = getNetworkConfig(network);
        const transaction = TransactionBuilder.fromXDR(
          challenge.data.challenge,
          networkConfig.networkPassphrase,
        );
        transaction.sign(keypair);
        const signedXdr = transaction.toXDR();

        // Submit signed challenge
        const authResponse = await client.postAuth(signedXdr);

        // Save session
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await privateChannels.setProviderSession(
          network,
          channelId,
          firstProviderId,
          accountId,
          { token: authResponse.token, expiresAt },
        );
        await privateChannels.setSelectedProvider(
          network,
          channelId,
          firstProviderId,
        );
        await privateChannels.flush();

        console.log("[dev-seed] Connected to provider:", provider.name);
      }
    } catch (err) {
      console.error("[dev-seed] Auto-connect failed:", err);
      // Non-fatal — user can connect manually
    }
  }

  // Mark seed as applied
  await chrome.storage.local.set({ [SEED_MARKER_KEY]: Date.now() });
  console.log("[dev-seed] Seed configuration applied successfully");
}
