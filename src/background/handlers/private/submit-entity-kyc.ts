import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { privateChannels, unlockVault, vault } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import { Buffer } from "buffer";
import { PrivacyProviderClient } from "@/background/services/privacy-provider-client.ts";

// Wallet-side KYC submission. Mirrors the dance the recording rig used to
// do server-side: fetch nonce → sign with the user's Stellar key → submit
// `{ pubkey, name, jurisdictions, signedChallenge }` → provider promotes the
// entity to APPROVED. We then mirror that status onto the existing session so
// the next bundle attempt clears the BND_011 gate.
export const handleSubmitEntityKyc: Handler<MessageType.SubmitEntityKyc> =
  async (message) => {
    try {
      const {
        network,
        channelId,
        providerId,
        accountId,
        password,
        name,
        jurisdictions,
      } = message;

      const channels = privateChannels.getChannels(network);
      const channel = channels.find((c) => c.id === channelId);
      const provider = channel?.providers.find((p) => p.id === providerId);
      if (!provider) {
        return {
          type: MessageType.SubmitEntityKyc,
          ok: false,
          error: { code: "UNKNOWN", message: "Provider not found" },
        };
      }
      if (!provider.pubkey) {
        return {
          type: MessageType.SubmitEntityKyc,
          ok: false,
          error: {
            code: "UNKNOWN",
            message:
              "Provider has no pubkey on record; re-add it with its public key.",
          },
        };
      }

      await unlockVault({ password });
      const state = vault.store.getValue();
      const found = state.wallets
        .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
        .find((x) => x.account.id === accountId);
      if (!found) {
        return {
          type: MessageType.SubmitEntityKyc,
          ok: false,
          error: { code: "UNKNOWN", message: "Account not found" },
        };
      }

      let keypair;
      if (found.wallet.type === "secret") {
        if (found.account.type !== "imported") {
          return {
            type: MessageType.SubmitEntityKyc,
            ok: false,
            error: {
              code: "UNKNOWN",
              message: "Invalid account type for secret wallet",
            },
          };
        }
        keypair = Keys.keypairFromSecret(found.account.secret!);
      } else {
        keypair = await Keys.deriveStellarKeypairFromMnemonic(
          found.wallet.mnemonic,
          found.account.type === "derived" ? found.account.index : 0,
        );
      }

      const client = new PrivacyProviderClient(
        provider.url,
        provider.pubkey,
      );
      const { nonce } = await client.getEntityChallenge(keypair.publicKey());

      // verify-stellar-signature accepts raw bytes: sign(base64-decoded nonce).
      const nonceBytes = Buffer.from(nonce, "base64");
      const sig = keypair.sign(nonceBytes);
      const signatureB64 = Buffer.from(sig).toString("base64");

      const result = await client.submitEntity({
        pubkey: keypair.publicKey(),
        name,
        jurisdictions: jurisdictions ?? [],
        signedChallenge: { nonce, signature: signatureB64 },
      });

      // Mirror the new entity status onto the existing session so the next
      // bundle attempt clears the BND_011 gate without forcing a reconnect.
      const channelsNow = privateChannels.getChannels(network);
      const channelNow = channelsNow.find((c) => c.id === channelId);
      const providerNow = channelNow?.providers.find((p) =>
        p.id === providerId
      );
      const session = providerNow?.sessions?.[accountId];
      if (session) {
        await privateChannels.setProviderSession(
          network,
          channelId,
          providerId,
          accountId,
          { ...session, entityStatus: result.status },
        );
      }
      await privateChannels.flush();

      return { type: MessageType.SubmitEntityKyc, ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        type: MessageType.SubmitEntityKyc,
        ok: false,
        error: { code: "UNKNOWN", message: msg },
      };
    }
  };
