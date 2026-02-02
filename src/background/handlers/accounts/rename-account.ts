import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { vault } from "@/background/session.ts";

export const handleRenameAccount = async (
  message: MessageFor<MessageType.RenameAccount>,
): Promise<ResponseFor<MessageType.RenameAccount>> => {
  try {
    if (vault.isLocked()) {
      return {
        type: MessageType.RenameAccount,
        ok: false,
        error: { code: "LOCKED", message: "Wallet is locked" },
      };
    }

    const walletId = message.walletId;
    const accountId = message.accountId;
    const name = message.name?.trim() ?? "";

    if (!walletId || !accountId) {
      return {
        type: MessageType.RenameAccount,
        ok: false,
        error: { code: "UNKNOWN", message: "Invalid key" },
      };
    }

    if (!name) {
      return {
        type: MessageType.RenameAccount,
        ok: false,
        error: { code: "UNKNOWN", message: "Name is required" },
      };
    }

    vault.store.update((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (w.id !== walletId) return w;

        if (w.type === "mnemonic") {
          const accounts = w.accounts.map((a) =>
            a.id === accountId ? { ...a, name } : a
          );

          // Keep wallet name in sync with the main derived key (index 0).
          const renamed = accounts.find((a) => a.id === accountId);
          const shouldUpdateWalletName = renamed?.type === "derived" &&
            (renamed.index ?? 0) === 0;

          return {
            ...w,
            name: shouldUpdateWalletName ? name : w.name,
            accounts,
          };
        }

        // secret wallet
        const accounts = w.accounts.map((a) =>
          a.id === accountId ? { ...a, name } : a
        );

        // Secret wallets currently have a single imported account; keep wallet name synced.
        return { ...w, name, accounts };
      }),
    }));

    await vault.flush();

    return { type: MessageType.RenameAccount, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.RenameAccount,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
