import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta, vault } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import type {
  DerivedAccount,
  MnemonicWallet,
} from "@/persistence/stores/vault.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export const handleDeriveAccount = async (
  _message: MessageFor<MessageType.DeriveAccount>
): Promise<ResponseFor<MessageType.DeriveAccount>> => {
  try {
    if (vault.isLocked()) {
      return {
        type: MessageType.DeriveAccount,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    const metaState = meta.store.getValue();
    const mainKey = metaState.mainKey;
    if (!mainKey) {
      return {
        type: MessageType.DeriveAccount,
        ok: false,
        error: { code: "UNKNOWN", message: "Missing main key" },
      };
    }

    const state = vault.store.getValue();
    const wallet = state.wallets.find((w) => w.id === mainKey.walletId);
    if (!wallet || wallet.type !== "mnemonic") {
      return {
        type: MessageType.DeriveAccount,
        ok: false,
        error: { code: "UNKNOWN", message: "Main wallet is not mnemonic" },
      };
    }

    const mnemonicWallet = wallet as MnemonicWallet;
    const maxIndex = mnemonicWallet.accounts.reduce(
      (acc, a) => Math.max(acc, a.index ?? 0),
      -1
    );
    const nextIndex = maxIndex + 1;

    const derived = await Keys.deriveStellarAccountFromMnemonic(
      mnemonicWallet.mnemonic,
      nextIndex
    );

    const newAccount: DerivedAccount = {
      id: crypto.randomUUID(),
      type: "derived",
      name: `Account ${nextIndex + 1}`,
      publicKey: derived.publicKey as Ed25519PublicKey,
      derivationPath: derived.derivationPath,
      index: derived.index,
    };

    vault.store.update((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (w.id !== mnemonicWallet.id) return w;
        return {
          ...w,
          accounts: [...w.accounts, newAccount],
        };
      }),
    }));

    await vault.flush();

    meta.setLastSelectedAccount({
      walletId: mnemonicWallet.id,
      accountId: newAccount.id,
    });
    await meta.flush();

    return {
      type: MessageType.DeriveAccount,
      ok: true,
      walletId: mnemonicWallet.id,
      accountId: newAccount.id,
      publicKey: String(newAccount.publicKey),
      index: newAccount.index,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.DeriveAccount,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
