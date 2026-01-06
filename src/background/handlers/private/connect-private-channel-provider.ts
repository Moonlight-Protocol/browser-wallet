import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { PrivateChannelsStore } from "@/persistence/stores/private-channels.ts";

export const handleConnectPrivateChannelProvider: Handler<
  MessageType.ConnectPrivateChannelProvider
> = async (message) => {
  const { channelAddress, providerUrl, jwt, expiresAt, accountId } =
    message.payload;

  const store = new PrivateChannelsStore();
  await store.setProviderSession(channelAddress, providerUrl, accountId, {
    token: jwt,
    expiresAt,
  });

  return {
    type: MessageType.ConnectPrivateChannelProvider,
    payload: undefined,
  };
};
