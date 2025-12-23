import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { AddPrivateChannelPayload } from "@/background/handlers/private/add-private-channel.types.ts";
import type { AddPrivateChannelResponse } from "@/background/handlers/private/add-private-channel.types.ts";

export async function addPrivateChannel(payload: AddPrivateChannelPayload) {
  const res = (await callBackground({
    type: MessageType.AddPrivateChannel,
    ...payload,
  })) as AddPrivateChannelResponse;

  return res;
}
