import type { BackgroundError } from "@/background/types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export type ImportWalletRequest = {
  mnemonic: string;
  name?: string;
};

export type ImportWalletResponse =
  | {
      walletId: string;
      firstPublicKey: Ed25519PublicKey;
    }
  | {
      error: BackgroundError;
    };
