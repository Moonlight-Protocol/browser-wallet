import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";

export const disconnectPrivateChannelProvider = async (params: {
  channelAddress: string;
  providerUrl: string;
  accountId: string;
}): Promise<void> => {
  await callBackground<MessageType.DisconnectPrivateChannelProvider>({
    type: MessageType.DisconnectPrivateChannelProvider,
    payload: params,
  });
};
