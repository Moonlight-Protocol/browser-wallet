import type { BackgroundError } from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { SigningRequestType } from "@/background/services/signing-manager.ts";

export type RequestSigningRequest = {
  requestType: SigningRequestType;
  xdr: string;
  accountId: string;
  network: ChainNetwork;
};

export type RequestSigningResponse =
  | {
      ok: true;
      requestId: string;
      signedXdr: string;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
