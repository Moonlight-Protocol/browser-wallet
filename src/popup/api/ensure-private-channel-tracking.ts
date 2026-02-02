import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type {
  EnsurePrivateChannelTrackingRequest,
  EnsurePrivateChannelTrackingResponse,
} from "@/background/handlers/private/ensure-private-channel-tracking.types.ts";

export async function ensurePrivateChannelTracking(
  payload: EnsurePrivateChannelTrackingRequest,
) {
  const res = (await callBackground(
    {
      type: MessageType.EnsurePrivateChannelTracking,
      ...payload,
    },
    { timeoutMs: 120_000 },
  )) as EnsurePrivateChannelTrackingResponse;

  return res;
}
