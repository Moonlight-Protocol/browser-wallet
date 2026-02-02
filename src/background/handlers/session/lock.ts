import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { lockVault } from "@/background/session.ts";

export const handleLock = (
  _message: MessageFor<MessageType.Lock>,
): ResponseFor<MessageType.Lock> => {
  lockVault();
  return { type: MessageType.Lock, ok: true };
};
