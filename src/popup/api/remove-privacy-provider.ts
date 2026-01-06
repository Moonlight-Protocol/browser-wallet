import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function removePrivacyProvider(params: {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
}): Promise<void> {
  const res = await callBackground({
    type: MessageType.RemovePrivacyProvider,
    network: params.network,
    channelId: params.channelId,
    providerId: params.providerId,
  });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to remove provider",
      res.error.code
    );
  }
}
