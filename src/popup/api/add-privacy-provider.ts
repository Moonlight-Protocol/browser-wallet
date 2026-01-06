import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function addPrivacyProvider(params: {
  network: ChainNetwork;
  channelId: string;
  name: string;
  url: string;
}): Promise<{ providerId: string }> {
  const res = await callBackground({
    type: MessageType.AddPrivacyProvider,
    network: params.network,
    channelId: params.channelId,
    name: params.name,
    url: params.url,
  });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to add provider",
      res.error.code
    );
  }

  if ("providerId" in res) {
    return { providerId: res.providerId };
  }

  throw new ApiError("Invalid response", "UNKNOWN");
}
