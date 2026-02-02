import type { BackgroundError } from "@/background/types.ts";
import type {
  ChainAccountState,
  ChainNetwork,
} from "@/persistence/stores/chain.types.ts";

export type GetChainStateRequest = {
  network: ChainNetwork;
  publicKey: string;
};

export type GetChainStateResponse =
  | {
    state: ChainAccountState;
    stale: boolean;
    syncing: boolean;
  }
  | {
    error: BackgroundError;
  };
