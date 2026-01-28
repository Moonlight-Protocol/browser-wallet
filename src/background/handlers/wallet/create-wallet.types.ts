import type { BackgroundError } from "@/background/types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export type CreateWalletRequest = {
  name?: string;
};

export type CreateWalletResponse =
  | {
    firstPublicKey: Ed25519PublicKey;
    mnemonic: string;
  }
  | {
    error: BackgroundError;
  };
