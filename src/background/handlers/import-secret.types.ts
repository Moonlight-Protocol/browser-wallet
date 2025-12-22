import type { BackgroundError } from "@/background/types.ts";

export type ImportSecretRequest = {
  secret: string;
};

export type ImportSecretResponse =
  | {
      ok: true;
      walletId: string;
      accountId: string;
      publicKey: string;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
