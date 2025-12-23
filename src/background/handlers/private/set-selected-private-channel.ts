import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleSetSelectedPrivateChannel = async (
  message: MessageFor<MessageType.SetSelectedPrivateChannel>
): Promise<ResponseFor<MessageType.SetSelectedPrivateChannel>> => {
  try {
    privateChannels.setSelectedChannelId(message.network, message.channelId);
    await privateChannels.flush();

    return { type: MessageType.SetSelectedPrivateChannel, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.SetSelectedPrivateChannel,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
