import type { BackgroundError } from "@/background/types.ts";

export type DeriveAccountRequest = Record<string, never>;

export type DeriveAccountResponse =
  | {
      ok: true;
      walletId: string;
      accountId: string;
      publicKey: string;
      index: number;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
