import { EncryptedPersistedStore } from "@/persistence/safe-store.ts";
import type { EncryptionAdapter } from "@/persistence/types.ts";
import { VaultState } from "@/persistence/stores/vault.types.ts";

const DEFAULT_VAULT_STATE: VaultState = {
  wallets: [],
};

export class VaultStore extends EncryptedPersistedStore<VaultState> {
  constructor(encryption?: EncryptionAdapter) {
    super("vault", DEFAULT_VAULT_STATE, encryption, {
      storageKey: "vault@store",
      persist: true,
    });
  }
}
