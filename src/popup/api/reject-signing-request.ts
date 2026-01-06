import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { RejectSigningRequestResponse } from "@/background/handlers/signing/reject-signing-request.types.ts";

export async function rejectSigningRequest(
  requestId: string
): Promise<RejectSigningRequestResponse["payload"]> {
  const response = await callBackground({
    type: MessageType.RejectSigningRequest,
    payload: {
      requestId,
    },
  });
  return response.payload;
}
