import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleSetSelectedPrivacyProvider = async (
  message: MessageFor<MessageType.SetSelectedPrivacyProvider>
): Promise<ResponseFor<MessageType.SetSelectedPrivacyProvider>> => {
  try {
    privateChannels.setSelectedProvider(
      message.network,
      message.channelId,
      message.providerId
    );

    await privateChannels.flush();

    return {
      type: MessageType.SetSelectedPrivacyProvider,
      ok: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.SetSelectedPrivacyProvider,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
