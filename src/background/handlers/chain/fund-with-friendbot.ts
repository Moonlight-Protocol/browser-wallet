import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { requestFriendbotFunding } from "@/background/contexts/chain/friendbot.ts";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";

export const handleFundWithFriendbot = async (
  message: MessageFor<MessageType.FundWithFriendbot>,
): Promise<ResponseFor<MessageType.FundWithFriendbot>> => {
  try {
    const networkConfig = getNetworkConfig(message.network);
    await requestFriendbotFunding({
      networkConfig,
      publicKey: message.publicKey,
    });

    return {
      type: MessageType.FundWithFriendbot,
      ok: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.FundWithFriendbot,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
