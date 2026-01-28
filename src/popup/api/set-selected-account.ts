import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function setSelectedAccount(params: {
  walletId: string;
  accountId: string;
}): Promise<void> {
  const res = await callBackground({
    type: MessageType.SetSelectedAccount,
    walletId: params.walletId,
    accountId: params.accountId,
  });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to select account",
      res.error.code,
    );
  }
}
