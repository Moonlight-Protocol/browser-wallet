import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta, vault } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import type {
  DerivedAccount,
  MnemonicWallet,
} from "@/persistence/stores/vault.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export const handleImportWallet = async (
  message: MessageFor<MessageType.ImportWallet>
): Promise<ResponseFor<MessageType.ImportWallet>> => {
  try {
    if (vault.isLocked()) {
      return {
        type: MessageType.ImportWallet,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    const mnemonic = message.mnemonic?.trim().replace(/\s+/g, " ") ?? "";
    if (!mnemonic) {
      return {
        type: MessageType.ImportWallet,
        error: { code: "INVALID_MNEMONIC", message: "Mnemonic is required" },
      };
    }

    if (!Keys.validateMnemonic(mnemonic)) {
      return {
        type: MessageType.ImportWallet,
        error: { code: "INVALID_MNEMONIC", message: "Invalid mnemonic" },
      };
    }

    const state = vault.store.getValue();
    const walletNumber = state.wallets.length + 1;

    const metaState = meta.store.getValue();
    const hasMain = Boolean(metaState.mainKey);

    const account = await Keys.deriveStellarAccountFromMnemonic(mnemonic, 0);
    const publicKey = account.publicKey as Ed25519PublicKey;

    const defaultName =
      message.name ?? (hasMain ? `Imported ${walletNumber}` : "Account 1");

    const wallet: MnemonicWallet = {
      id: crypto.randomUUID(),
      type: "mnemonic",
      // Keep wallet name in sync with the primary (index 0) derived key.
      name: defaultName,
      mnemonic,
      accounts: [
        {
          id: crypto.randomUUID(),
          type: "derived",
          name: defaultName,
          publicKey,
          derivationPath: account.derivationPath,
          index: account.index,
        } satisfies DerivedAccount,
      ],
    };

    vault.store.update((prev) => ({
      ...prev,
      wallets: [...prev.wallets, wallet],
    }));

    // Force persistence to storage.local before returning.
    await vault.flush();

    // Ensure we have a stable "main" reference.
    if (!hasMain) {
      meta.setMainKey({
        walletId: wallet.id,
        accountId: wallet.accounts[0].id,
      });
    }

    // Always select the imported key.
    meta.setLastSelectedAccount({
      walletId: wallet.id,
      accountId: wallet.accounts[0].id,
    });

    await meta.flush();

    return {
      type: MessageType.ImportWallet,
      walletId: wallet.id,
      firstPublicKey: publicKey,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.ImportWallet,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
