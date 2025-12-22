import { MessageType } from "@/background/messages.ts";
import type { SafeAccount } from "@/background/handlers/get-accounts.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function getAccounts(): Promise<SafeAccount[]> {
  const res = await callBackground({ type: MessageType.GetAccounts });

  if ("error" in res) {
    throw new ApiError("Wallet is locked", res.error.code);
  }

  return res.accounts;
}
