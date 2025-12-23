import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type {
  PrivateChannel,
  PrivateChannelAsset,
} from "@/persistence/stores/private-channels.types.ts";

export type AddPrivateChannelRequest = {
  network: ChainNetwork;
  name: string;
  contractId: string;
  quorumContractId: string;
  asset: PrivateChannelAsset;
};

export type AddPrivateChannelResponse =
  | {
      ok: true;
      channel: PrivateChannel;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
