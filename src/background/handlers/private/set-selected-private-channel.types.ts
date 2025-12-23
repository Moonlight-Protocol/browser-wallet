import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type SetSelectedPrivateChannelRequest = {
  network: ChainNetwork;
  channelId?: string;
};

export type SetSelectedPrivateChannelResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
