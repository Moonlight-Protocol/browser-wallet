import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";
import type { SigningRequest } from "@/background/services/signing-manager.ts";

export interface GetSigningRequestRequest extends BackgroundRequest {
  type: "GET_SIGNING_REQUEST";
  payload: {
    requestId: string;
  };
}

export interface GetSigningRequestResponse extends BackgroundResponse {
  payload: SigningRequest | undefined;
}
