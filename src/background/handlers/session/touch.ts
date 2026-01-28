import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { extendVaultSession } from "@/background/session.ts";

export const handleTouch = (
  message: MessageFor<MessageType.Touch>,
): ResponseFor<MessageType.Touch> => {
  const ok = extendVaultSession({ ttlMs: message.ttlMs });
  if (!ok) {
    return {
      type: MessageType.Touch,
      ok: false,
      error: { code: "LOCKED", message: "Wallet is locked" },
    };
  }

  return { type: MessageType.Touch, ok: true };
};
