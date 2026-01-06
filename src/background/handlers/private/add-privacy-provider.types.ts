import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type AddPrivacyProviderRequest = {
  network: ChainNetwork;
  channelId: string;
  name: string;
  url: string;
};

export type AddPrivacyProviderResponse =
  | {
      ok: true;
      providerId: string;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
