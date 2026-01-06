import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";

export interface ApproveSigningRequestRequest extends BackgroundRequest {
  type: "APPROVE_SIGNING_REQUEST";
  payload: {
    requestId: string;
    password: string;
  };
}

export interface ApproveSigningRequestResponse extends BackgroundResponse {
  payload: {
    signedXdr: string;
  };
}
