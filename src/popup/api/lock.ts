import { MessageType } from "@/background/messages.ts";
import type { LockResponse } from "@/background/handlers/session/lock.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function lock(): Promise<void> {
  const res = (await callBackground({
    type: MessageType.Lock,
  })) as LockResponse;

  // Lock currently always returns { ok: true }.
  // Keep a minimal guard in case we later add error cases.
  if (!("ok" in res) || res.ok !== true) {
    throw new ApiError("Lock failed");
  }
}
