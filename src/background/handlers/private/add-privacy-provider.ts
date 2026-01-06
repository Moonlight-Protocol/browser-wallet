import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleAddPrivacyProvider = async (
  message: MessageFor<MessageType.AddPrivacyProvider>
): Promise<ResponseFor<MessageType.AddPrivacyProvider>> => {
  try {
    const providerId = crypto.randomUUID();
    privateChannels.addProvider(message.network, message.channelId, {
      id: providerId,
      name: message.name,
      url: message.url,
    });

    await privateChannels.flush();

    return {
      type: MessageType.AddPrivacyProvider,
      ok: true,
      providerId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.AddPrivacyProvider,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
