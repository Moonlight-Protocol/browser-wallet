import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export type GetPrivateChannelsRequest = {
  network: ChainNetwork;
};

export type GetPrivateChannelsResponse =
  | {
      ok: true;
      network: ChainNetwork;
      channels: PrivateChannel[];
      selectedChannelId?: string;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
