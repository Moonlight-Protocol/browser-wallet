import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager } from "@/background/session.ts";

export const handleRejectSigningRequest: Handler<
  MessageType.RejectSigningRequest
> = (message) => {
  const { requestId } = message;
  signingManager.rejectRequest(
    requestId,
    new Error("User rejected signing request"),
  );

  return {
    type: MessageType.RejectSigningRequest,
    ok: true as const,
  };
};
