import { PersistedStore } from "@/persistence/store.ts";
import type {
  ChainAccountState,
  ChainState,
} from "@/persistence/stores/chain.types.ts";

const DEFAULT_CHAIN_STATE: ChainState = {
  version: 1,
  accounts: {},
};

export function chainKey(params: {
  network: string;
  publicKey: string;
}): string {
  return `${params.network}:${params.publicKey}`;
}

export class ChainStore extends PersistedStore<ChainState> {
  constructor() {
    super("chain", DEFAULT_CHAIN_STATE, {
      storageKey: "chain@store",
      persist: true,
    });
  }

  upsertAccount(state: ChainAccountState) {
    const key = chainKey(state);
    this.store.update((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [key]: state,
      },
    }));
  }

  setAccountPartial(
    params: { network: string; publicKey: string },
    patch: Partial<ChainAccountState>,
  ) {
    const key = chainKey(params);
    this.store.update((prev) => {
      const existing = prev.accounts[key];
      const {
        network: _network,
        publicKey: _publicKey,
        ...existingRest
      } = existing ?? ({} as ChainAccountState);
      const next: ChainAccountState = {
        network: params.network as ChainAccountState["network"],
        publicKey: params.publicKey,
        ...existingRest,
        ...patch,
      };

      return {
        ...prev,
        accounts: {
          ...prev.accounts,
          [key]: next,
        },
      };
    });
  }
}
