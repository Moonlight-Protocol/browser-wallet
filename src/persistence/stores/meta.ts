import { PersistedStore } from "@/persistence/store.ts";
import type { MetaState } from "@/persistence/stores/meta.types.ts";

const DEFAULT_META_STATE: MetaState = {
  version: 1,
  passwordSet: false,
  lastSelectedNetwork: "mainnet",
};

export class MetaStore extends PersistedStore<MetaState> {
  constructor() {
    super("meta", DEFAULT_META_STATE, {
      storageKey: "meta@store",
      persist: true,
    });
  }

  setPasswordSet(passwordSet: boolean) {
    this.store.update((state) => ({ ...state, passwordSet }));
  }

  setLastSelectedNetwork(
    lastSelectedNetwork: MetaState["lastSelectedNetwork"]
  ) {
    this.store.update((state) => ({ ...state, lastSelectedNetwork }));
  }

  setCustomNetworkName(customNetworkName: string | undefined) {
    this.store.update((state) => ({ ...state, customNetworkName }));
  }

  setMainKey(mainKey: MetaState["mainKey"]) {
    this.store.update((state) => ({ ...state, mainKey }));
  }

  setLastSelectedAccount(
    lastSelectedAccount: MetaState["lastSelectedAccount"]
  ) {
    this.store.update((state) => ({ ...state, lastSelectedAccount }));
  }
}
