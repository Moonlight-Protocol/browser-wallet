import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";
import { vault } from "@/background/session.ts";
import type {
  DerivedAccount,
  ImportedSecretAccount,
  VaultWallet,
} from "@/persistence/stores/vault.types.ts";

function toSafeAccounts(wallet: VaultWallet): SafeAccount[] {
  if (wallet.type === "mnemonic") {
    return wallet.accounts.map((account: DerivedAccount) => ({
      walletId: wallet.id,
      walletType: wallet.type,
      walletName: wallet.name,
      accountId: account.id,
      accountType: account.type,
      publicKey: account.publicKey,
      name: account.name,
      derivationPath: account.derivationPath,
      index: account.index,
    }));
  }

  return wallet.accounts.map((account: ImportedSecretAccount) => ({
    walletId: wallet.id,
    walletType: wallet.type,
    walletName: wallet.name,
    accountId: account.id,
    accountType: account.type,
    publicKey: account.publicKey,
    name: account.name,
  }));
}

export const handleGetAccounts = (
  _message: MessageFor<MessageType.GetAccounts>,
): ResponseFor<MessageType.GetAccounts> => {
  if (vault.isLocked()) {
    return { type: MessageType.GetAccounts, error: { code: "LOCKED" } };
  }
  const state = vault.store.getValue();
  const accounts = state.wallets.flatMap(toSafeAccounts);
  return { type: MessageType.GetAccounts, accounts };
};
