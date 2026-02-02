import type { BackgroundError } from "@/background/types.ts";

export type RenameAccountRequest = {
  walletId: string;
  accountId: string;
  name: string;
};

export type RenameAccountResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
