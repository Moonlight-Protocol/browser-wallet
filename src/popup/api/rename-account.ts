import { MessageType } from "@/background/messages.ts";
import type { RenameAccountResponse } from "@/background/handlers/rename-account.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function renameAccount(params: {
  walletId: string;
  accountId: string;
  name: string;
}): Promise<void> {
  const res = (await callBackground({
    type: MessageType.RenameAccount,
    walletId: params.walletId,
    accountId: params.accountId,
    name: params.name,
  })) as RenameAccountResponse;

  if (!res.ok) {
    throw new ApiError(
      res.error.message ?? "Failed to rename key",
      res.error.code
    );
  }
}
