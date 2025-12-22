import { MessageType } from "@/background/messages.ts";
import type { DeriveAccountResponse } from "@/background/handlers/derive-account.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function deriveAccount(): Promise<void> {
  const res = (await callBackground({
    type: MessageType.DeriveAccount,
  })) as DeriveAccountResponse;

  if (!res.ok) {
    throw new ApiError(
      res.error.message ?? "Failed to derive key",
      res.error.code
    );
  }
}
