import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function setSelectedPrivacyProvider(params: {
  network: ChainNetwork;
  channelId: string;
  providerId: string | undefined;
}): Promise<void> {
  const res = await callBackground({
    type: MessageType.SetSelectedPrivacyProvider,
    network: params.network,
    channelId: params.channelId,
    providerId: params.providerId,
  });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to select provider",
      res.error.code,
    );
  }
}
