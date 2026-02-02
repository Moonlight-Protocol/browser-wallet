import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { GetSigningRequestResponse } from "@/background/handlers/signing/get-signing-request.types.ts";

export async function getSigningRequest(
  requestId: string,
): Promise<GetSigningRequestResponse> {
  const response = await callBackground({
    type: MessageType.GetSigningRequest,
    requestId,
  });
  return response as GetSigningRequestResponse;
}
