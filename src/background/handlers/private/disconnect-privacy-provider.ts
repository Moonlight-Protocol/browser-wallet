import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";

export const handleDisconnectPrivacyProvider: Handler<
  MessageType.DisconnectPrivacyProvider
> = async (message) => {
  const { network, channelId, providerId, accountId } = message.payload;

  privateChannels.clearProviderSession(
    network,
    channelId,
    providerId,
    accountId
  );

  return {
    type: MessageType.DisconnectPrivacyProvider,
    payload: undefined,
  };
};
