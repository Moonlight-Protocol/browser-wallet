import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { GetSigningRequestResponse } from "@/background/handlers/signing/get-signing-request.types.ts";

export async function getSigningRequest(
  requestId: string
): Promise<GetSigningRequestResponse["payload"]> {
  const response = await callBackground({
    type: MessageType.GetSigningRequest,
    payload: {
      requestId,
    },
  });
  return response.payload;
}
