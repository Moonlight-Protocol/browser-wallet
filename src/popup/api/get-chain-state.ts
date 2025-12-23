import { MessageType } from "@/background/messages.ts";
import type { GetChainStateResponse } from "@/background/handlers/chain/get-chain-state.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function getChainState(params: {
  network: ChainNetwork;
  publicKey: string;
}) {
  const res = (await callBackground({
    type: MessageType.GetChainState,
    network: params.network,
    publicKey: params.publicKey,
  })) as GetChainStateResponse;

  if ("error" in res) {
    throw new ApiError(
      res.error.message ?? "Failed to load chain state",
      res.error.code
    );
  }

  return res;
}
