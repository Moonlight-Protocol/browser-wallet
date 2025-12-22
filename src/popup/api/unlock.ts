import { MessageType } from "@/background/messages.ts";
import type { UnlockResponse } from "@/background/handlers/unlock.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function unlock(params: {
  password: string;
  ttlMs?: number;
}): Promise<void> {
  const res = (await callBackground({
    type: MessageType.Unlock,
    password: params.password,
    ttlMs: params.ttlMs,
  })) as UnlockResponse;

  if (!res.ok) {
    throw new ApiError(res.error.message ?? "Unlock failed", res.error.code);
  }
}
