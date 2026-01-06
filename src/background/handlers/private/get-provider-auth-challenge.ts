import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { PrivateChannelProviderClient } from "@/background/services/private-channel-provider-client.ts";

export const handleGetProviderAuthChallenge: Handler<
  MessageType.GetProviderAuthChallenge
> = async (message) => {
  const { providerUrl, publicKey } = message.payload;

  const client = new PrivateChannelProviderClient(providerUrl);
  const response = await client.getAuthChallenge(publicKey);

  return {
    type: MessageType.GetProviderAuthChallenge,
    payload: response,
  };
};
