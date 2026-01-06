import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager } from "@/background/session.ts";

export const handleRejectSigningRequest: Handler<
  MessageType.RejectSigningRequest
> = async (message) => {
  const { requestId } = message.payload;
  signingManager.rejectRequest(
    requestId,
    new Error("User rejected signing request")
  );

  return {
    type: MessageType.RejectSigningRequest,
    payload: undefined,
  };
};
