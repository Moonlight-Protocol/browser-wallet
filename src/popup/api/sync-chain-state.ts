import { MessageType } from "@/background/messages.ts";
import type { SyncChainStateResponse } from "@/background/handlers/chain/sync-chain-state.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function syncChainState(params: {
  items: Array<{
    network: ChainNetwork;
    publicKey: string;
    priority?: boolean;
  }>;
  onlyIfStale?: boolean;
}): Promise<void> {
  const res = (await callBackground({
    type: MessageType.SyncChainState,
    items: params.items,
    onlyIfStale: params.onlyIfStale,
  })) as SyncChainStateResponse;

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to sync chain state",
      res.error.code,
    );
  }
}
