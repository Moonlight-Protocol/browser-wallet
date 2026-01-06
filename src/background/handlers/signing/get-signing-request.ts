import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager } from "@/background/session.ts";

export const handleGetSigningRequest: Handler<MessageType.GetSigningRequest> = (
  message
) => {
  const { requestId } = message;
  const request = signingManager.getRequest(requestId);

  return {
    type: MessageType.GetSigningRequest,
    ok: true as const,
    request,
  };
};
