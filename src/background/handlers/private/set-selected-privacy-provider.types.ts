import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type SetSelectedPrivacyProviderRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string | undefined;
};

export type SetSelectedPrivacyProviderResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
