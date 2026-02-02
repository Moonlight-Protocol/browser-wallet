import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannelStats } from "@/persistence/stores/private-utxos.types.ts";

export type EnsurePrivateChannelTrackingRequest = {
  network: ChainNetwork;
  accountId: string;
  channelId: string;
  targetUtxos?: number;
};

export type EnsurePrivateChannelTrackingResponse =
  | {
    ok: true;
    stats: PrivateChannelStats;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
