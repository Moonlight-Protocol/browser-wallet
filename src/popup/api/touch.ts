import { MessageType } from "@/background/messages.ts";
import type { TouchResponse } from "@/background/handlers/session/touch.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function touch(params?: { ttlMs?: number }): Promise<void> {
  const res = (await callBackground({
    type: MessageType.Touch,
    ttlMs: params?.ttlMs,
  })) as TouchResponse;

  if (!res.ok) {
    throw new ApiError(res.error.message ?? "Wallet is locked", res.error.code);
  }
}
