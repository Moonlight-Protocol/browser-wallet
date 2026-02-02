import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta, vault } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import type {
  ImportedSecretAccount,
  ImportedSecretWallet,
} from "@/persistence/stores/vault.types.ts";
import type { Ed25519PublicKey, Ed25519SecretKey } from "@colibri/core";

export const handleImportSecret = async (
  message: MessageFor<MessageType.ImportSecret>,
): Promise<ResponseFor<MessageType.ImportSecret>> => {
  try {
    if (vault.isLocked()) {
      return {
        type: MessageType.ImportSecret,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    const secret = message.secret?.trim() ?? "";
    if (!secret) {
      return {
        type: MessageType.ImportSecret,
        ok: false,
        error: { code: "INVALID_SECRET", message: "Secret is required" },
      };
    }

    let publicKey: string;
    try {
      publicKey = Keys.publicKeyFromSecret(secret);
    } catch {
      return {
        type: MessageType.ImportSecret,
        ok: false,
        error: { code: "INVALID_SECRET", message: "Invalid secret" },
      };
    }

    const state = vault.store.getValue();
    const walletNumber = state.wallets.length + 1;

    const metaState = meta.store.getValue();
    const hasMain = Boolean(metaState.mainKey);

    const defaultName = hasMain ? `Imported ${walletNumber}` : "Account 1";

    const account: ImportedSecretAccount = {
      id: crypto.randomUUID(),
      type: "imported",
      name: defaultName,
      publicKey: publicKey as Ed25519PublicKey,
      secret: secret as Ed25519SecretKey,
    };

    const wallet: ImportedSecretWallet = {
      id: crypto.randomUUID(),
      type: "secret",
      name: defaultName,
      accounts: [account],
    };

    vault.store.update((prev) => ({
      ...prev,
      wallets: [...prev.wallets, wallet],
    }));

    await vault.flush();

    if (!hasMain) {
      meta.setMainKey({ walletId: wallet.id, accountId: account.id });
    }

    // Always select the imported key.
    meta.setLastSelectedAccount({ walletId: wallet.id, accountId: account.id });

    await meta.flush();

    return {
      type: MessageType.ImportSecret,
      ok: true,
      walletId: wallet.id,
      accountId: account.id,
      publicKey,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.ImportSecret,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
