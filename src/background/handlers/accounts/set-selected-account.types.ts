import type { BackgroundError } from "@/background/types.ts";

export type SetSelectedAccountRequest = {
  walletId: string;
  accountId: string;
};

export type SetSelectedAccountResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
