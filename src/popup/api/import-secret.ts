import { MessageType } from "@/background/messages.ts";
import type { ImportSecretResponse } from "@/background/handlers/accounts/import-secret.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function importSecret(params: { secret: string }): Promise<void> {
  const res = (await callBackground({
    type: MessageType.ImportSecret,
    secret: params.secret,
  })) as ImportSecretResponse;

  if (!res.ok) {
    const fallback = res.error.code === "LOCKED"
      ? "Wallet is locked. Unlock to continue."
      : res.error.code === "INVALID_SECRET"
      ? "Invalid secret key."
      : "Failed to import secret";

    throw new ApiError(res.error.message ?? fallback, res.error.code);
  }
}
