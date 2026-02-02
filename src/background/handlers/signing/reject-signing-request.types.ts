import type { BackgroundError } from "@/background/types.ts";

export type RejectSigningRequestRequest = {
  requestId: string;
};

export type RejectSigningRequestResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
