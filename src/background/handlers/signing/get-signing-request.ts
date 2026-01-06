import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager } from "@/background/session.ts";

export const handleGetSigningRequest: Handler<
  MessageType.GetSigningRequest
> = async (message) => {
  const { requestId } = message.payload;
  const request = signingManager.getRequest(requestId);

  return {
    type: MessageType.GetSigningRequest,
    payload: request,
  };
};
