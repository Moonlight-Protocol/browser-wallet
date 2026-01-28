import type { BackgroundError } from "@/background/types.ts";

export type ApproveSigningRequestRequest = {
  requestId: string;
  password: string;
};

export type ApproveSigningRequestResponse =
  | {
    ok: true;
    signedXdr: string;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
