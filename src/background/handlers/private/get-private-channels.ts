import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleGetPrivateChannels = (
  message: MessageFor<MessageType.GetPrivateChannels>
): ResponseFor<MessageType.GetPrivateChannels> => {
  try {
    const channels = privateChannels.getChannels(message.network);
    const selectedChannelId = privateChannels.getSelectedChannelId(
      message.network
    );

    return {
      type: MessageType.GetPrivateChannels,
      ok: true,
      network: message.network,
      channels,
      selectedChannelId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.GetPrivateChannels,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
