import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type SyncChainStateItem = {
  network: ChainNetwork;
  publicKey: string;
  priority?: boolean;
};

export type SyncChainStateRequest = {
  items: SyncChainStateItem[];
  onlyIfStale?: boolean;
};

export type SyncChainStateResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
