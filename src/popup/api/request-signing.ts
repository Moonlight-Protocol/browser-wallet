import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type {
  RequestSigningRequest,
  RequestSigningResponse,
} from "@/background/handlers/signing/request-signing.types.ts";

export const requestSigning = (
  params: RequestSigningRequest,
): Promise<RequestSigningResponse> => {
  return callBackground({
    type: MessageType.RequestSigning,
    ...params,
  }) as Promise<RequestSigningResponse>;
};
