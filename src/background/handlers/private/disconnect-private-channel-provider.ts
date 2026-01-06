import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { PrivateChannelsStore } from "@/persistence/stores/private-channels.ts";

export const handleDisconnectPrivateChannelProvider: Handler<
  MessageType.DisconnectPrivateChannelProvider
> = async (message) => {
  const { channelAddress, providerUrl, accountId } = message.payload;

  const store = new PrivateChannelsStore();
  await store.clearProviderSession(channelAddress, providerUrl, accountId);

  return {
    type: MessageType.DisconnectPrivateChannelProvider,
    payload: undefined,
  };
};
