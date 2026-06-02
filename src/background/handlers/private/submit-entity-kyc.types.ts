import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type SubmitEntityKycRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  password: string;
  name: string;
  jurisdictions?: string[];
};

export type SubmitEntityKycResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
