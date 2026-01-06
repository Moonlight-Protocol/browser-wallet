import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannelStats } from "@/persistence/stores/private-utxos.types.ts";

export type GetPrivateStatsRequest = {
  network: ChainNetwork;
  accountId: string;
  channelId: string;
};

export type GetPrivateStatsResponse =
  | {
      ok: true;
      stats: PrivateChannelStats | undefined;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
