import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { AccountActivationStatus } from "@/background/contexts/chain/account-activation.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export type GetAccountActivationStatusRequest = {
  network: ChainNetwork;
  publicKey: Ed25519PublicKey;
};

export type GetAccountActivationStatusResponse =
  | {
      status: AccountActivationStatus;
      canUseFriendbot: boolean;
    }
  | {
      status: "unknown";
      canUseFriendbot: boolean;
      error: BackgroundError;
    };
