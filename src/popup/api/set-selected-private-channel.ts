import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { SetSelectedPrivateChannelPayload } from "@/background/handlers/private/set-selected-private-channel.types.ts";
import type { SetSelectedPrivateChannelResponse } from "@/background/handlers/private/set-selected-private-channel.types.ts";

export async function setSelectedPrivateChannel(
  payload: SetSelectedPrivateChannelPayload,
) {
  const res = (await callBackground({
    type: MessageType.SetSelectedPrivateChannel,
    ...payload,
  })) as SetSelectedPrivateChannelResponse;

  return res;
}
