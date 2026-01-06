import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type RemovePrivacyProviderRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
};

export type RemovePrivacyProviderResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
