import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { GetPrivateChannelsResponse } from "@/background/handlers/private/get-private-channels.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function getPrivateChannels(params: { network: ChainNetwork }) {
  const res = (await callBackground({
    type: MessageType.GetPrivateChannels,
    network: params.network,
  })) as GetPrivateChannelsResponse;

  return res;
}
