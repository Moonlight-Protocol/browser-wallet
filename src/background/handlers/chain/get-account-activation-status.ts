import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { checkAccountActivationStatus } from "@/background/contexts/chain/account-activation.ts";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";
import { chain } from "@/background/session.ts";

export const handleGetAccountActivationStatus = async (
  message: MessageFor<MessageType.GetAccountActivationStatus>
): Promise<ResponseFor<MessageType.GetAccountActivationStatus>> => {
  let canUseFriendbot = false;
  try {
    const networkConfig = getNetworkConfig(message.network);
    const status = await checkAccountActivationStatus({
      networkConfig,
      publicKey: message.publicKey,
    });

    canUseFriendbot = Boolean(networkConfig.friendbotUrl);

    if (status === "created") {
      chain.setAccountPartial(
        { network: message.network, publicKey: message.publicKey },
        { created: true, createdConfirmed: true }
      );
      await chain.flush();
    }

    return {
      type: MessageType.GetAccountActivationStatus,
      status,
      canUseFriendbot,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.GetAccountActivationStatus,
      status: "unknown",
      canUseFriendbot,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
