import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { lockVault } from "@/background/session.ts";

export const handleLock = async (
  _message: MessageFor<MessageType.Lock>
): Promise<ResponseFor<MessageType.Lock>> => {
  lockVault();
  return { type: MessageType.Lock, ok: true };
};
