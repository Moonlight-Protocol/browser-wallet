import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";
import { extractPpPubkeyFromUrl } from "@/background/services/pp-url.ts";

export const handleAddPrivacyProvider = async (
  message: MessageFor<MessageType.AddPrivacyProvider>,
): Promise<ResponseFor<MessageType.AddPrivacyProvider>> => {
  try {
    // Authoritative URL shape validation: the URL must encode the PP's
    // Stellar pubkey as its last path segment. The popup form does a soft
    // check first; the background is the gate.
    if (!extractPpPubkeyFromUrl(message.url)) {
      return {
        type: MessageType.AddPrivacyProvider,
        ok: false,
        error: {
          code: "UNKNOWN",
          message:
            "Provider URL must end with the PP's Stellar public key (e.g. https://provider-x.example/G…).",
        },
      };
    }
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
