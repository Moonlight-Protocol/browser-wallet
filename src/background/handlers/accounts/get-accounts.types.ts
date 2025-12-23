import type { Ed25519PublicKey } from "@colibri/core";
import type { BackgroundError } from "@/background/types.ts";

export type SafeAccount = {
  walletId: string;
  walletType: "mnemonic" | "secret";
  walletName?: string;
  accountId: string;
  accountType: "derived" | "imported";
  publicKey: Ed25519PublicKey;
  name?: string;
  derivationPath?: string;
  index?: number;
};

export type GetAccountsRequest = Record<string, never>;

export type GetAccountsResponse =
  | {
      accounts: SafeAccount[];
    }
  | {
      error: BackgroundError;
    };
