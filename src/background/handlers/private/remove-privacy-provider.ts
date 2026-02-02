import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleRemovePrivacyProvider = async (
  message: MessageFor<MessageType.RemovePrivacyProvider>,
): Promise<ResponseFor<MessageType.RemovePrivacyProvider>> => {
  try {
    privateChannels.removeProvider(
      message.network,
      message.channelId,
      message.providerId,
    );

    await privateChannels.flush();

    return {
      type: MessageType.RemovePrivacyProvider,
      ok: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.RemovePrivacyProvider,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
