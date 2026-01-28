import { MessageType } from "@/background/messages.ts";
import type { GetPrivateStatsResponse } from "@/background/handlers/private/get-private-stats.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function getPrivateStats(params: {
  network: ChainNetwork;
  accountId: string;
  channelId: string;
}) {
  const res = (await callBackground({
    type: MessageType.GetPrivateStats,
    network: params.network,
    accountId: params.accountId,
    channelId: params.channelId,
  })) as GetPrivateStatsResponse;

  if (!res.ok) {
    throw new ApiError(
      res.error.message ?? "Failed to get private stats",
      res.error.code,
    );
  }

  return res.stats;
}
