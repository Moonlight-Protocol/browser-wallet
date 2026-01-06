import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { SigningRequestType } from "@/background/services/signing-manager.ts";

export interface RequestSigningRequest extends BackgroundRequest {
  type: "REQUEST_SIGNING";
  payload: {
    type: SigningRequestType;
    xdr: string;
    accountId: string;
    network: ChainNetwork;
  };
}

export interface RequestSigningResponse extends BackgroundResponse {
  payload: {
    requestId: string;
    signedXdr: string;
  };
}
