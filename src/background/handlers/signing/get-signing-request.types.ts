import type { BackgroundError } from "@/background/types.ts";
import type { SigningRequest } from "@/background/services/signing-manager.ts";

export type GetSigningRequestRequest = {
  requestId: string;
};

export type GetSigningRequestResponse =
  | {
      ok: true;
      request: SigningRequest | undefined;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
