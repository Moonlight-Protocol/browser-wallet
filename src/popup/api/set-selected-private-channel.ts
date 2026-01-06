import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type {
  SetSelectedPrivateChannelRequest,
  SetSelectedPrivateChannelResponse,
} from "@/background/handlers/private/set-selected-private-channel.types.ts";

export async function setSelectedPrivateChannel(
  payload: SetSelectedPrivateChannelRequest
) {
  const res = (await callBackground({
    type: MessageType.SetSelectedPrivateChannel,
    ...payload,
  })) as SetSelectedPrivateChannelResponse;

  return res;
}
