import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export type FundWithFriendbotRequest = {
  network: ChainNetwork;
  publicKey: Ed25519PublicKey;
};

export type FundWithFriendbotResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
