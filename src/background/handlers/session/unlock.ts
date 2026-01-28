import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { unlockVault } from "@/background/session.ts";

export const handleUnlock = async (
  message: MessageFor<MessageType.Unlock>,
): Promise<ResponseFor<MessageType.Unlock>> => {
  try {
    if (!message.password) {
      return {
        type: MessageType.Unlock,
        ok: false,
        error: { code: "INVALID_PASSWORD", message: "Password required" },
      };
    }

    await unlockVault({ password: message.password, ttlMs: message.ttlMs });

    return { type: MessageType.Unlock, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.Unlock,
      ok: false,
      error: { code: "INVALID_PASSWORD", message: msg },
    };
  }
};
