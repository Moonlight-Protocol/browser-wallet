import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { ApproveSigningRequestResponse } from "@/background/handlers/signing/approve-signing-request.types.ts";

export async function approveSigningRequest(
  requestId: string,
  password: string
): Promise<ApproveSigningRequestResponse> {
  const response = await callBackground({
    type: MessageType.ApproveSigningRequest,
    requestId,
    password,
  });
  return response as ApproveSigningRequestResponse;
}
