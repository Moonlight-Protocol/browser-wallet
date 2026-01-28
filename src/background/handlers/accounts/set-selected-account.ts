import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta } from "@/background/session.ts";

export const handleSetSelectedAccount = async (
  message: MessageFor<MessageType.SetSelectedAccount>,
): Promise<ResponseFor<MessageType.SetSelectedAccount>> => {
  const walletId = message.walletId;
  const accountId = message.accountId;

  if (!walletId || !accountId) {
    return {
      type: MessageType.SetSelectedAccount,
      ok: false,
      error: { code: "UNKNOWN", message: "Invalid account selection" },
    };
  }

  meta.setLastSelectedAccount({ walletId, accountId });
  await meta.flush();

  return { type: MessageType.SetSelectedAccount, ok: true };
};
