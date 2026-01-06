import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";

export interface RejectSigningRequestRequest extends BackgroundRequest {
  type: "REJECT_SIGNING_REQUEST";
  payload: {
    requestId: string;
  };
}

export interface RejectSigningRequestResponse extends BackgroundResponse {
  payload: void;
}
